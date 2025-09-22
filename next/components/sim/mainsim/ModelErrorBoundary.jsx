import React from 'react';
import { PreviewBox } from "@/components/sim/preview/PreviewBox";

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Model Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <PreviewBox
          position={[0, 0, 0]}
          size={[1, 1, 1]}
          isLoading={false}
          isError={true}
        />
      );
    }

    return this.props.children;
  }
}

export default ModelErrorBoundary;