import Layout from "@/layout/layout";
import styles from "@/styles/preview.module.scss";

const colorTokens = [
  "--color-surface",
  "--color-surface-muted",
  "--color-surface-subtle",
  "--color-border",
  "--color-border-strong",
  "--color-shadow",
  "--color-text",
  "--color-text-muted",
  "--color-link",
  "--color-link-strong",
  "--color-primary",
  "--color-primary-strong",
  "--color-accent",
  "--color-success-bg",
  "--color-success-border",
  "--color-success-hover-bg",
  "--color-success-hover-border",
  "--color-success-text",
  "--color-success-hover-text",
  "--color-danger-bg",
  "--color-danger-border",
  "--color-danger-hover-bg",
  "--color-danger-hover-border",
  "--color-danger-text",
  "--color-danger-hover-text",
  "--color-subtle-border",
  "--color-subtle-hover-border",
  "--color-subtle-text",
  "--color-subtle-hover-text",
  "--color-empty-border",
  "--color-card-shadow",
];

export default function Preview() {
  return (
    <Layout>
      <div className={styles.wrapper}>
        <h1>Design Tokens Preview</h1>
        <p className={styles.lead}>
          Quick look at the global color variables. Colors are pulled from CSS
          custom properties to keep the palette consistent.
        </p>

        <div className={styles.grid}>
          {colorTokens.map((token) => (
            <div key={token} className={styles.swatch}>
              <div
                className={styles.box}
                style={{ background: `var(${token})` }}
              />
              <div className={styles.label}>{token}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
