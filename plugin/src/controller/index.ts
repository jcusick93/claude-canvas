// Figma plugin sandbox — handles Figma API calls routed from the UI iframe

figma.showUI(__html__, { themeColors: true, width: 360, height: 560 });

// Serialize a node to a plain object
function serializeNode(node: SceneNode): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if ("x" in node) base.x = node.x;
  if ("y" in node) base.y = node.y;
  if ("width" in node) base.width = node.width;
  if ("height" in node) base.height = node.height;

  if ("fills" in node) {
    try { base.fills = JSON.parse(JSON.stringify(node.fills)); } catch (_e) {}
  }
  if ("strokes" in node) {
    try { base.strokes = JSON.parse(JSON.stringify(node.strokes)); } catch (_e) {}
  }
  if ("effects" in node) {
    try { base.effects = JSON.parse(JSON.stringify(node.effects)); } catch (_e) {}
  }
  if ("characters" in node) {
    base.characters = (node as TextNode).characters;
    base.fontSize = (node as TextNode).fontSize;
  }

  return base;
}

// Build a lightweight layer tree
function buildTree(node: BaseNode, depth = 0): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    id: node.id,
    name: node.name,
    type: node.type,
  };
  if ("children" in node && depth < 4) {
    entry.children = (node as ChildrenMixin & BaseNode).children.map((c: SceneNode) => buildTree(c, depth + 1));
  }
  return entry;
}

// Handle requests from the UI iframe
figma.ui.onmessage = async (msg: {
  type: string;
  requestId?: string;
  action?: string;
  params?: Record<string, unknown>;
  key?: string;
  value?: unknown;
}) => {
  if (msg.type === "open_external") {
    const { url } = msg as unknown as { type: string; url: string };
    if (url) figma.openExternal(url);
    return;
  }

  // Handle clientStorage requests
  if (msg.type === "storage_request") {
    const { requestId, action, key, value } = msg as {
      requestId: string; action: string; key: string; value?: unknown;
    };
    try {
      let data: unknown;
      switch (action) {
        case "get":
          data = await figma.clientStorage.getAsync(key);
          break;
        case "set":
          await figma.clientStorage.setAsync(key, value);
          break;
        case "delete":
          await figma.clientStorage.deleteAsync(key);
          break;
        default:
          throw new Error(`Unknown storage action: ${action}`);
      }
      figma.ui.postMessage({ type: "storage_result", requestId, data });
    } catch (err: any) {
      figma.ui.postMessage({ type: "storage_result", requestId, error: err.message });
    }
    return;
  }

  if (msg.type !== "figma_request") return;

  const { requestId, action, params } = msg;
  try {
    let result: unknown;

    switch (action) {
      case "get_selection": {
        result = figma.currentPage.selection.map(serializeNode);
        break;
      }

      case "get_page_structure": {
        result = buildTree(figma.currentPage);
        break;
      }

      case "create_element": {
        const { elementType, x = 0, y = 0, width = 100, height = 100, name, fillColor, text, fontSize } = params as {
          elementType: string; x?: number; y?: number; width?: number; height?: number;
          name?: string; fillColor?: { r: number; g: number; b: number };
          text?: string; fontSize?: number;
        };

        let node: SceneNode;

        switch (elementType) {
          case "RECTANGLE": {
            const rect = figma.createRectangle();
            rect.resize(width, height);
            node = rect;
            break;
          }
          case "ELLIPSE": {
            const ellipse = figma.createEllipse();
            ellipse.resize(width, height);
            node = ellipse;
            break;
          }
          case "LINE": {
            const line = figma.createLine();
            line.resize(width, 0);
            node = line;
            break;
          }
          case "FRAME": {
            const frame = figma.createFrame();
            frame.resize(width, height);
            node = frame;
            break;
          }
          case "TEXT": {
            const textNode = figma.createText();
            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            if (fontSize) textNode.fontSize = fontSize;
            if (text) textNode.characters = text;
            node = textNode;
            break;
          }
          default:
            throw new Error(`Unknown element type: ${elementType}`);
        }

        node.x = x as number;
        node.y = y as number;
        if (name) node.name = name;

        if (fillColor && "fills" in node) {
          (node as GeometryMixin).fills = [{ type: "SOLID", color: fillColor }];
        }

        figma.currentPage.appendChild(node);
        result = { id: node.id, name: node.name };
        break;
      }

      case "modify_element": {
        const { nodeId, ...props } = params as {
          nodeId: string; x?: number; y?: number; width?: number; height?: number;
          name?: string; fillColor?: { r: number; g: number; b: number };
          text?: string; fontSize?: number;
        };
        const target = await figma.getNodeByIdAsync(nodeId);
        if (!target || target.type === "DOCUMENT" || target.type === "PAGE") {
          throw new Error(`Node not found: ${nodeId}`);
        }
        const sceneNode = target as SceneNode;

        if (props.x !== undefined) sceneNode.x = props.x;
        if (props.y !== undefined) sceneNode.y = props.y;
        if (props.width !== undefined && props.height !== undefined && "resize" in sceneNode) {
          (sceneNode as SceneNode & { resize(w: number, h: number): void }).resize(props.width, props.height);
        } else if (props.width !== undefined && "resize" in sceneNode) {
          (sceneNode as SceneNode & { resize(w: number, h: number): void }).resize(props.width, ("height" in sceneNode ? (sceneNode as any).height : 100));
        } else if (props.height !== undefined && "resize" in sceneNode) {
          (sceneNode as SceneNode & { resize(w: number, h: number): void }).resize(("width" in sceneNode ? (sceneNode as any).width : 100), props.height);
        }
        if (props.name) sceneNode.name = props.name;
        if (props.fillColor && "fills" in sceneNode) {
          (sceneNode as GeometryMixin).fills = [{ type: "SOLID", color: props.fillColor }];
        }
        if (sceneNode.type === "TEXT") {
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
          if (props.fontSize !== undefined) (sceneNode as TextNode).fontSize = props.fontSize;
          if (props.text !== undefined) (sceneNode as TextNode).characters = props.text;
        }

        result = { id: sceneNode.id, name: sceneNode.name };
        break;
      }

      case "create_component": {
        const { nodeId } = params as { nodeId: string };
        const target = await figma.getNodeByIdAsync(nodeId);
        if (!target || target.type === "DOCUMENT" || target.type === "PAGE") {
          throw new Error(`Node not found: ${nodeId}`);
        }
        const comp = figma.createComponentFromNode(target as SceneNode);
        result = { id: comp.id, name: comp.name };
        break;
      }

      case "add_variants": {
        const { nodeId, variants } = params as {
          nodeId: string;
          variants: Array<{ name: string; fillColor?: { r: number; g: number; b: number } }>;
        };
        const source = await figma.getNodeByIdAsync(nodeId);
        if (!source || source.type !== "COMPONENT") {
          throw new Error(`Component not found: ${nodeId}`);
        }
        const sourceComp = source as ComponentNode;

        // Rename the original to be the first variant
        const components: ComponentNode[] = [sourceComp];

        // Clone for each additional variant
        for (const v of variants) {
          const clone = sourceComp.clone();
          clone.name = v.name;
          if (v.fillColor && "fills" in clone) {
            (clone as GeometryMixin).fills = [{ type: "SOLID", color: v.fillColor }];
          }
          figma.currentPage.appendChild(clone);
          components.push(clone);
        }

        // Combine into a component set
        const componentSet = figma.combineAsVariants(components, figma.currentPage);
        result = {
          id: componentSet.id,
          name: componentSet.name,
          variants: components.map((c) => ({ id: c.id, name: c.name })),
        };
        break;
      }

      case "delete_element": {
        const { nodeId } = params as { nodeId: string };
        const target = await figma.getNodeByIdAsync(nodeId);
        if (!target || target.type === "DOCUMENT" || target.type === "PAGE") {
          throw new Error(`Node not found: ${nodeId}`);
        }
        const name = target.name;
        (target as SceneNode).remove();
        result = { deleted: true, name };
        break;
      }

      // --- Styles ---

      case "get_local_styles": {
        const paintStyles = (await figma.getLocalPaintStylesAsync()).map(s => ({
          id: s.id, name: s.name, type: "PAINT",
          paints: JSON.parse(JSON.stringify(s.paints)),
        }));
        const textStyles = (await figma.getLocalTextStylesAsync()).map(s => ({
          id: s.id, name: s.name, type: "TEXT",
          fontSize: s.fontSize, fontName: s.fontName,
          letterSpacing: s.letterSpacing, lineHeight: s.lineHeight,
        }));
        const effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => ({
          id: s.id, name: s.name, type: "EFFECT",
          effects: JSON.parse(JSON.stringify(s.effects)),
        }));
        const gridStyles = (await figma.getLocalGridStylesAsync()).map(s => ({
          id: s.id, name: s.name, type: "GRID",
          grids: JSON.parse(JSON.stringify(s.layoutGrids)),
        }));
        result = { paintStyles, textStyles, effectStyles, gridStyles };
        break;
      }

      case "create_style": {
        const { styleType, name: styleName, properties } = params as {
          styleType: string; name: string; properties: Record<string, unknown>;
        };
        switch (styleType) {
          case "PAINT": {
            const style = figma.createPaintStyle();
            style.name = styleName;
            if (properties.color) {
              const c = properties.color as { r: number; g: number; b: number };
              style.paints = [{ type: "SOLID", color: c }];
            }
            if (properties.paints) {
              style.paints = properties.paints as Paint[];
            }
            result = { id: style.id, name: style.name };
            break;
          }
          case "TEXT": {
            const style = figma.createTextStyle();
            style.name = styleName;
            if (properties.fontSize) style.fontSize = properties.fontSize as number;
            if (properties.fontFamily) {
              style.fontName = { family: properties.fontFamily as string, style: (properties.fontStyle as string) || "Regular" };
            }
            if (properties.letterSpacing) style.letterSpacing = properties.letterSpacing as LetterSpacing;
            if (properties.lineHeight) style.lineHeight = properties.lineHeight as LineHeight;
            result = { id: style.id, name: style.name };
            break;
          }
          case "EFFECT": {
            const style = figma.createEffectStyle();
            style.name = styleName;
            if (properties.effects) style.effects = properties.effects as Effect[];
            result = { id: style.id, name: style.name };
            break;
          }
          case "GRID": {
            const style = figma.createGridStyle();
            style.name = styleName;
            if (properties.grids) style.layoutGrids = properties.grids as LayoutGrid[];
            result = { id: style.id, name: style.name };
            break;
          }
          default:
            throw new Error(`Unknown style type: ${styleType}`);
        }
        break;
      }

      case "set_style": {
        const { nodeId, styleId, styleType } = params as {
          nodeId: string; styleId: string; styleType: string;
        };
        const target = await figma.getNodeByIdAsync(nodeId) as SceneNode;
        if (!target) throw new Error(`Node not found: ${nodeId}`);
        switch (styleType) {
          case "PAINT":
            if ("fillStyleId" in target) (target as any).fillStyleId = styleId;
            break;
          case "STROKE":
            if ("strokeStyleId" in target) (target as any).strokeStyleId = styleId;
            break;
          case "TEXT":
            if (target.type === "TEXT") {
              await figma.loadFontAsync((target as TextNode).fontName as FontName);
              (target as TextNode).textStyleId = styleId;
            }
            break;
          case "EFFECT":
            if ("effectStyleId" in target) (target as any).effectStyleId = styleId;
            break;
          case "GRID":
            if ("gridStyleId" in target) (target as any).gridStyleId = styleId;
            break;
          default:
            throw new Error(`Unknown style type: ${styleType}`);
        }
        result = { applied: true, nodeId, styleId, styleType };
        break;
      }

      // --- Variables & Tokens ---

      case "get_local_variables": {
        const collections = (await figma.variables.getLocalVariableCollectionsAsync()).map(c => ({
          id: c.id, name: c.name,
          modes: c.modes, defaultModeId: c.defaultModeId,
          variableIds: c.variableIds,
        }));
        const variables = (await figma.variables.getLocalVariablesAsync()).map(v => ({
          id: v.id, name: v.name,
          resolvedType: v.resolvedType,
          valuesByMode: JSON.parse(JSON.stringify(v.valuesByMode)),
        }));
        result = { collections, variables };
        break;
      }

      case "modify_variables": {
        const {
          variableCollections = [],
          variableModes = [],
          variables = [],
          variableModeValues = [],
        } = params as {
          variableCollections?: Array<{
            action: string; id?: string; name?: string; hiddenFromPublishing?: boolean;
          }>;
          variableModes?: Array<{
            action: string; variableCollectionId: string; modeId?: string; name?: string;
          }>;
          variables?: Array<{
            action: string; id?: string; variableCollectionId?: string; name?: string;
            resolvedType?: VariableResolvedDataType; description?: string;
            hiddenFromPublishing?: boolean; scopes?: string[];
            codeSyntax?: { WEB?: string; ANDROID?: string; iOS?: string };
          }>;
          variableModeValues?: Array<{
            variableId: string; modeId: string; value: unknown;
          }>;
        };

        const tempIdToRealId: Record<string, string> = {};
        const resolveId = (id: string) => tempIdToRealId[id] || id;

        // 1. Variable collections
        for (const op of variableCollections) {
          switch (op.action) {
            case "CREATE": {
              const coll = figma.variables.createVariableCollection(op.name!);
              if (op.hiddenFromPublishing !== undefined) coll.hiddenFromPublishing = op.hiddenFromPublishing;
              if (op.id) {
                tempIdToRealId[op.id] = coll.id;
                // Also map the default mode
                tempIdToRealId[`${op.id}:defaultMode`] = coll.defaultModeId;
              }
              break;
            }
            case "UPDATE": {
              const coll = await figma.variables.getVariableCollectionByIdAsync(resolveId(op.id!));
              if (!coll) throw new Error(`Collection not found: ${op.id}`);
              if (op.name !== undefined) coll.name = op.name;
              if (op.hiddenFromPublishing !== undefined) coll.hiddenFromPublishing = op.hiddenFromPublishing;
              break;
            }
            case "DELETE": {
              const coll = await figma.variables.getVariableCollectionByIdAsync(resolveId(op.id!));
              if (!coll) throw new Error(`Collection not found: ${op.id}`);
              coll.remove();
              break;
            }
          }
        }

        // 2. Variable modes
        for (const op of variableModes) {
          const collId = resolveId(op.variableCollectionId);
          const coll = await figma.variables.getVariableCollectionByIdAsync(collId);
          if (!coll) throw new Error(`Collection not found: ${op.variableCollectionId}`);

          switch (op.action) {
            case "CREATE": {
              const modeId = coll.addMode(op.name!);
              if (op.modeId) tempIdToRealId[op.modeId] = modeId;
              break;
            }
            case "UPDATE": {
              const realModeId = resolveId(op.modeId!);
              coll.renameMode(realModeId, op.name!);
              break;
            }
            case "DELETE": {
              const realModeId = resolveId(op.modeId!);
              coll.removeMode(realModeId);
              break;
            }
          }
        }

        // 3. Variables
        for (const op of variables) {
          switch (op.action) {
            case "CREATE": {
              const collId = resolveId(op.variableCollectionId!);
              const v = figma.variables.createVariable(op.name!, collId, op.resolvedType!);
              if (op.id) tempIdToRealId[op.id] = v.id;
              if (op.description !== undefined) v.description = op.description;
              if (op.hiddenFromPublishing !== undefined) v.hiddenFromPublishing = op.hiddenFromPublishing;
              if (op.scopes) v.scopes = op.scopes as VariableScope[];
              if (op.codeSyntax) {
                if (op.codeSyntax.WEB) v.setVariableCodeSyntax("WEB", op.codeSyntax.WEB);
                if (op.codeSyntax.ANDROID) v.setVariableCodeSyntax("ANDROID", op.codeSyntax.ANDROID);
                if (op.codeSyntax.iOS) v.setVariableCodeSyntax("iOS", op.codeSyntax.iOS);
              }
              break;
            }
            case "UPDATE": {
              const v = await figma.variables.getVariableByIdAsync(resolveId(op.id!));
              if (!v) throw new Error(`Variable not found: ${op.id}`);
              if (op.name !== undefined) v.name = op.name;
              if (op.description !== undefined) v.description = op.description;
              if (op.hiddenFromPublishing !== undefined) v.hiddenFromPublishing = op.hiddenFromPublishing;
              if (op.scopes) v.scopes = op.scopes as VariableScope[];
              if (op.codeSyntax) {
                if (op.codeSyntax.WEB) v.setVariableCodeSyntax("WEB", op.codeSyntax.WEB);
                if (op.codeSyntax.ANDROID) v.setVariableCodeSyntax("ANDROID", op.codeSyntax.ANDROID);
                if (op.codeSyntax.iOS) v.setVariableCodeSyntax("iOS", op.codeSyntax.iOS);
              }
              break;
            }
            case "DELETE": {
              const v = await figma.variables.getVariableByIdAsync(resolveId(op.id!));
              if (!v) throw new Error(`Variable not found: ${op.id}`);
              v.remove();
              break;
            }
          }
        }

        // 4. Variable mode values
        for (const entry of variableModeValues) {
          const varId = resolveId(entry.variableId);
          const modeId = resolveId(entry.modeId);
          const v = await figma.variables.getVariableByIdAsync(varId);
          if (!v) throw new Error(`Variable not found: ${entry.variableId}`);

          let val = entry.value;
          // Resolve alias references
          if (val && typeof val === "object" && (val as any).type === "VARIABLE_ALIAS") {
            val = { type: "VARIABLE_ALIAS", id: resolveId((val as any).id) } as VariableAlias;
          }
          v.setValueForMode(modeId, val as VariableValue);
        }

        result = { success: true, tempIdToRealId };
        break;
      }

      case "set_variable": {
        const { nodeId, variableId, field } = params as {
          nodeId: string; variableId: string; field: string;
        };
        const target = await figma.getNodeByIdAsync(nodeId) as SceneNode;
        if (!target) throw new Error(`Node not found: ${nodeId}`);
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (!variable) throw new Error(`Variable not found: ${variableId}`);

        if (field === "fill") {
          if ("fills" in target) {
            const fills = JSON.parse(JSON.stringify((target as GeometryMixin).fills)) as SolidPaint[];
            if (fills.length > 0) {
              fills[0] = figma.variables.setBoundVariableForPaint(fills[0], "color", variable);
            }
            (target as GeometryMixin).fills = fills;
          }
        } else {
          (target as any).setBoundVariable(field, variable);
        }
        result = { bound: true, nodeId, variableId, field };
        break;
      }

      // --- Auto Layout ---

      case "set_auto_layout": {
        const {
          nodeId, direction, spacing, paddingTop, paddingRight, paddingBottom, paddingLeft,
          primaryAxisAlignItems, counterAxisAlignItems,
          primaryAxisSizingMode, counterAxisSizingMode,
        } = params as {
          nodeId: string; direction?: string; spacing?: number;
          paddingTop?: number; paddingRight?: number; paddingBottom?: number; paddingLeft?: number;
          primaryAxisAlignItems?: string; counterAxisAlignItems?: string;
          primaryAxisSizingMode?: string; counterAxisSizingMode?: string;
        };
        const target = await figma.getNodeByIdAsync(nodeId) as FrameNode;
        if (!target || !("layoutMode" in target)) throw new Error(`Frame not found: ${nodeId}`);

        if (direction) target.layoutMode = direction as "HORIZONTAL" | "VERTICAL";
        else if (target.layoutMode === "NONE") target.layoutMode = "HORIZONTAL";
        if (spacing !== undefined) target.itemSpacing = spacing;
        if (paddingTop !== undefined) target.paddingTop = paddingTop;
        if (paddingRight !== undefined) target.paddingRight = paddingRight;
        if (paddingBottom !== undefined) target.paddingBottom = paddingBottom;
        if (paddingLeft !== undefined) target.paddingLeft = paddingLeft;
        if (primaryAxisAlignItems) target.primaryAxisAlignItems = primaryAxisAlignItems as any;
        if (counterAxisAlignItems) target.counterAxisAlignItems = counterAxisAlignItems as any;
        if (primaryAxisSizingMode) target.primaryAxisSizingMode = primaryAxisSizingMode as any;
        if (counterAxisSizingMode) target.counterAxisSizingMode = counterAxisSizingMode as any;

        result = { id: target.id, name: target.name, layoutMode: target.layoutMode };
        break;
      }

      // --- Grouping & Boolean Operations ---

      case "group_nodes": {
        const { nodeIds } = params as { nodeIds: string[] };
        const nodes: SceneNode[] = [];
        for (const id of nodeIds) {
          const n = await figma.getNodeByIdAsync(id) as SceneNode;
          if (!n) throw new Error(`Node not found: ${id}`);
          nodes.push(n);
        }
        const group = figma.group(nodes, figma.currentPage);
        result = { id: group.id, name: group.name };
        break;
      }

      case "boolean_operation": {
        const { nodeIds, operation } = params as { nodeIds: string[]; operation: string };
        const nodes: SceneNode[] = [];
        for (const id of nodeIds) {
          const n = await figma.getNodeByIdAsync(id) as SceneNode;
          if (!n) throw new Error(`Node not found: ${id}`);
          nodes.push(n);
        }
        const boolOps: Record<string, "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE"> = {
          UNION: "UNION", SUBTRACT: "SUBTRACT", INTERSECT: "INTERSECT", EXCLUDE: "EXCLUDE",
        };
        const op = boolOps[operation];
        if (!op) throw new Error(`Unknown operation: ${operation}`);

        const boolNode = figma.createBooleanOperation();
        boolNode.booleanOperation = op;
        for (const n of nodes) {
          boolNode.appendChild(n);
        }
        figma.currentPage.appendChild(boolNode);
        result = { id: boolNode.id, name: boolNode.name, operation: op };
        break;
      }

      // --- Instances ---

      case "create_instance": {
        const { componentId, x = 0, y = 0 } = params as {
          componentId: string; x?: number; y?: number;
        };
        const comp = await figma.getNodeByIdAsync(componentId);
        if (!comp || comp.type !== "COMPONENT") throw new Error(`Component not found: ${componentId}`);
        const instance = (comp as ComponentNode).createInstance();
        instance.x = x as number;
        instance.y = y as number;
        figma.currentPage.appendChild(instance);
        result = { id: instance.id, name: instance.name, componentId };
        break;
      }

      // --- Export ---

      case "export_node": {
        const { nodeId, format = "PNG", scale = 1 } = params as {
          nodeId: string; format?: string; scale?: number;
        };
        const target = await figma.getNodeByIdAsync(nodeId) as SceneNode;
        if (!target) throw new Error(`Node not found: ${nodeId}`);

        const settings: ExportSettings = format === "SVG"
          ? { format: "SVG" }
          : format === "PDF"
            ? { format: "PDF" }
            : { format: format as "PNG" | "JPG", constraint: { type: "SCALE", value: scale } };

        const bytes = await (target as any).exportAsync(settings);
        const base64 = figma.base64Encode(bytes);
        result = { format, size: bytes.length, base64 };
        break;
      }

      // --- Insert SVG ---

      case "create_node_from_svg": {
        const { svg, x = 0, y = 0, name: svgName } = params as {
          svg: string; x?: number; y?: number; name?: string;
        };
        const svgNode = figma.createNodeFromSvg(svg);
        svgNode.x = x as number;
        svgNode.y = y as number;
        if (svgName) svgNode.name = svgName;
        figma.currentPage.appendChild(svgNode);
        result = { id: svgNode.id, name: svgNode.name };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    figma.ui.postMessage({ type: "figma_response", requestId, success: true, data: result });
  } catch (err: any) {
    figma.ui.postMessage({ type: "figma_response", requestId, success: false, error: err.message });
  }
};
