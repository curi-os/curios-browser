import type React from "react";

export interface CSSPropertiesWithWebkit extends React.CSSProperties {
  WebkitTextSecurity?: string;
}
