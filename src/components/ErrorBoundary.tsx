import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(" Erreur capturée par ErrorBoundary :", error);
    console.error("Stack :", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-3">
          <h2 className="font-bold text-base">
            Une erreur est survenue dans cette vue
          </h2>
          <p className="text-xs text-red-700">
            Le composant associé à cet onglet a planté. Détails techniques :
          </p>
          <pre className="text-[11px] whitespace-pre-wrap bg-white border border-red-200 rounded p-3 overflow-auto">
            {this.state.error?.message}
          </pre>
          <pre className="text-[10px] whitespace-pre-wrap text-slate-600 max-h-48 overflow-auto">
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}