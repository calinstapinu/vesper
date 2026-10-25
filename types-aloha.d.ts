import "react";
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "aloha-mascot": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { variant?: string; size?: string | number; surface?: string; wake?: string };
    }
  }
}
