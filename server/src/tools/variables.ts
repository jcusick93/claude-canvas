import { z } from "zod";
import type { ToolContext } from "./types.js";

export function registerVariablesTools(ctx: ToolContext): void {
  const { mcp, ws } = ctx;

  // ── Bulk variable operations (mirrors Figma REST API POST /variables) ──

  mcp.registerTool(
    "modify_variables",
    {
      description: `Bulk create, update, and delete variable collections, modes, variables, and mode values in a single atomic operation.

Mirrors the Figma REST API POST /v1/files/:file_key/variables endpoint.

Operations are applied in order: variableCollections → variableModes → variables → variableModeValues.

Temporary IDs: When creating entities, you may assign a temporary id (any string). Other operations in the same request can reference that temporary ID — the response includes a tempIdToRealId mapping.

Variable values by type:
- COLOR: { r, g, b, a } where each channel is 0–1
- FLOAT: a number
- STRING: a string
- BOOLEAN: true/false
- Alias: { type: "VARIABLE_ALIAS", id: "<variableId>" }`,
      inputSchema: {
        variableCollections: z
          .array(
            z.object({
              action: z.enum(["CREATE", "UPDATE", "DELETE"]),
              id: z
                .string()
                .optional()
                .describe(
                  "Required for UPDATE/DELETE (real ID). Optional for CREATE (temporary ID for cross-referencing)."
                ),
              name: z
                .string()
                .optional()
                .describe("Required for CREATE. Optional for UPDATE (rename)."),
              hiddenFromPublishing: z.boolean().optional(),
            })
          )
          .optional()
          .describe("Create, rename, or delete variable collections."),

        variableModes: z
          .array(
            z.object({
              action: z.enum(["CREATE", "UPDATE", "DELETE"]),
              variableCollectionId: z
                .string()
                .describe(
                  "The collection this mode belongs to. Can be a temporary ID from variableCollections."
                ),
              modeId: z
                .string()
                .optional()
                .describe(
                  "Required for UPDATE/DELETE. Optional for CREATE (temporary ID)."
                ),
              name: z
                .string()
                .optional()
                .describe(
                  "Required for CREATE. Optional for UPDATE (rename). Max 40 chars."
                ),
            })
          )
          .optional()
          .describe(
            "Add, rename, or remove modes in a collection. Max 40 modes per collection."
          ),

        variables: z
          .array(
            z.object({
              action: z.enum(["CREATE", "UPDATE", "DELETE"]),
              id: z
                .string()
                .optional()
                .describe(
                  "Required for UPDATE/DELETE (real ID). Optional for CREATE (temporary ID)."
                ),
              variableCollectionId: z
                .string()
                .optional()
                .describe("Required for CREATE. The collection to create in."),
              name: z
                .string()
                .optional()
                .describe("Required for CREATE. Optional for UPDATE (rename)."),
              resolvedType: z
                .enum(["COLOR", "FLOAT", "STRING", "BOOLEAN"])
                .optional()
                .describe("Required for CREATE."),
              description: z.string().optional(),
              hiddenFromPublishing: z.boolean().optional(),
              scopes: z
                .array(z.string())
                .optional()
                .describe(
                  "Scopes that limit where this variable can be applied."
                ),
              codeSyntax: z
                .object({
                  WEB: z.string().optional(),
                  ANDROID: z.string().optional(),
                  iOS: z.string().optional(),
                })
                .optional()
                .describe("Code syntax representations by platform."),
            })
          )
          .optional()
          .describe("Create, update, or delete variables."),

        variableModeValues: z
          .array(
            z.object({
              variableId: z
                .string()
                .describe("The variable to set. Can be a temporary ID."),
              modeId: z.string().describe("The mode to set the value for."),
              value: z
                .any()
                .describe(
                  "The value. Type depends on resolvedType: COLOR → {r,g,b,a}, FLOAT → number, STRING → string, BOOLEAN → boolean, alias → {type:'VARIABLE_ALIAS', id:'<varId>'}."
                ),
            })
          )
          .optional()
          .describe("Set variable values for specific modes."),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("modify_variables", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ── Bind a variable to a node property ──

  mcp.registerTool(
    "set_variable",
    {
      description: "Binds a variable to a node property.",
      inputSchema: {
        nodeId: z.string().describe("The node ID to bind the variable to"),
        variableId: z.string().describe("The variable ID to bind"),
        field: z
          .string()
          .describe(
            "The property field to bind (e.g. 'fill', 'width', 'height', 'opacity', 'itemSpacing')"
          ),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("set_variable", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
