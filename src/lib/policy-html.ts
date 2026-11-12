import "server-only";

import sanitizeHtml from "sanitize-html";

export function sanitizePolicyHtml(content: string) {
  return sanitizeHtml(content, {
    allowedTags: ["p", "h2", "h3", "ul", "ol", "li", "strong", "b", "em", "i", "a", "figure", "img", "br"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      p: ["class"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedClasses: { p: ["note"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
  });
}
