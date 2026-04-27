// Re-export from @texwritten/core
export { 
  RECOMMENDED_PREAMBLE, 
  formatBlockAsLatex, 
  buildFullLatex, 
  buildTexDocument, 
  buildMarkdownDocument, 
  escapeLatexText 
} from "../../packages/core/src/formatter.js";

// Keep REPORT_SNIPPETS (internal usage)
export const REPORT_SNIPPETS = String.raw`% Equation numerotee
\begin{equation}
  E = mc^2
\end{equation}

% Systeme aligne
\[
\begin{aligned}
  ax + by &= c \\
  dx + ey &= f
\end{aligned}
\]

% Matrice
\[
A = \begin{bmatrix}
  1 & 0 \\
  0 & 1
\end{bmatrix}
\]

% Grandeur avec unite SI
\[
v = \SI{3.2}{\meter\per\second}
\]`;