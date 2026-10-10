export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-screen flex min-h-dvh flex-col">{children}</div>;
}
