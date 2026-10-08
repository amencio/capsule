import React from "react";
import { View, Text, Pressable } from "react-native";

interface State {
  hasError: boolean;
  resetKey: number;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, resetKey: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, resetKey: this.state.resetKey + 1 });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-space-deep px-6">
          <Text className="text-neon-red text-3xl font-bold mb-3">
            🚨 Houston
          </Text>
          <Text className="text-neon-red text-lg font-bold mb-2">
            On a un problème.
          </Text>
          <Text className="text-white/50 text-sm text-center mb-8">
            {"Une erreur inattendue est survenue. L'orbite a été interrompue."}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="bg-neon-green rounded-xl px-6 py-3.5"
          >
            <Text className="text-space-deep font-bold">
              {"🔄 Reprendre l'orbite"}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
