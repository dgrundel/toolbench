import { WorkspaceIcon } from "./WorkspaceIcon";

type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

type JsonObject = {
  [key: string]: JsonValue;
};

type JsonValueInspectorProps = {
  value: JsonValue | unknown;
};

export function JsonValueInspector({ value }: JsonValueInspectorProps) {
  return <div className="json-inspector">{renderJsonValue(value)}</div>;
}

function renderJsonValue(value: JsonValue | unknown): JSX.Element {
  if (Array.isArray(value)) {
    return (
      <details className="json-inspector__details" open>
        <summary className="json-inspector__summary">
          <WorkspaceIcon name="caret-down" size={12} className="json-inspector__summary-icon json-inspector__summary-icon--open" />
          <WorkspaceIcon name="caret-right" size={12} className="json-inspector__summary-icon json-inspector__summary-icon--closed" />
          {summaryLabel("Array", value.length)}
        </summary>
        <div className="json-inspector__children json-inspector__children--array">
          {value.map((item, index) => (
            <div className="json-inspector__row" key={index}>
              <div className="json-inspector__key json-inspector__key--index">{index}</div>
              <div className="json-inspector__value">{renderJsonValue(item)}</div>
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    return (
      <details className="json-inspector__details" open>
        <summary className="json-inspector__summary">
          <WorkspaceIcon name="caret-down" size={12} className="json-inspector__summary-icon json-inspector__summary-icon--open" />
          <WorkspaceIcon name="caret-right" size={12} className="json-inspector__summary-icon json-inspector__summary-icon--closed" />
          {summaryLabel("Object", entries.length)}
        </summary>
        <div className="json-inspector__children json-inspector__children--object">
          {entries.map(([key, item]) => (
            <div className="json-inspector__row" key={key}>
              <div className="json-inspector__key">{key}</div>
              <div className="json-inspector__value">{renderJsonValue(item)}</div>
            </div>
          ))}
        </div>
      </details>
    );
  }

  return <span className={`json-inspector__scalar ${scalarClassName(value)}`}>{renderScalar(value)}</span>;
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function renderScalar(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return String(value);
}

function scalarClassName(value: unknown) {
  if (value === null) {
    return "json-inspector__scalar--null";
  }

  if (typeof value === "string") {
    return "json-inspector__scalar--string";
  }

  if (typeof value === "number") {
    return "json-inspector__scalar--number";
  }

  if (typeof value === "boolean") {
    return "json-inspector__scalar--boolean";
  }

  return "json-inspector__scalar--unknown";
}

function summaryLabel(kind: "Object" | "Array", count: number) {
  const suffix = count === 1 ? "item" : "items";
  return `${kind} (${count} ${suffix})`;
}
