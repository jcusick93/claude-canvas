import { useState } from "react";
import styles from "./Landing.module.css";
import { BurstIcon } from "../Icons/Icons";

const GREETINGS = [
  "Auto layout your thoughts.",
  "Let's push some pixels.",
  "Your canvas awaits.",
  "No more lorem ipsum.",
  "Frames, fills, and fresh ideas.",
  "Think in components.",
  "From wireframe to wow.",
  "Design with intent.",
  "Every pixel has a purpose.",
  "Ship something beautiful.",
];

export function Landing() {
  const [greeting] = useState(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  );

  return (
    <div className={styles.root}>
      <BurstIcon className={styles.burst} />
      <span className={styles.greeting}>{greeting}</span>
    </div>
  );
}
