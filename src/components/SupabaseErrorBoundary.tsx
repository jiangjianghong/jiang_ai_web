import React from 'react';

interface SupabaseErrorBoundaryProps {
  children: React.ReactNode;
}

interface SupabaseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SupabaseErrorBoundary extends React.Component<SupabaseErrorBoundaryProps, SupabaseErrorBoundaryState> {
  constructor(props: SupabaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SupabaseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Supabase配置错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isSupabaseConfigError = this.state.error?.message?.includes('Supabase environment variables');
      
      if (isSupabaseConfigError) {
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '40px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              maxWidth: '600px'
            }}>
              <h1 style={{ marginBottom: '20px', fontSize: '2rem' }}>🔧 系统配置中...</h1>
              <p style={{ marginBottom: '20px', fontSize: '1.1rem', opacity: 0.9 }}>
                应用正在更新配置，请稍后片刻
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  <strong>技术说明：</strong> Supabase环境变量配置中，GitHub Actions正在重新部署...
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
                如果问题持续，请联系管理员
              </p>
            </div>
          </div>
        );
      }
    }

    return this.props.children;
  }
}

export default SupabaseErrorBoundary;
