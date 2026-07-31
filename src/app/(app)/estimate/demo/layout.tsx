import './compact.css';

export default function EstimateDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="estimate-demo-compact">{children}</div>;
}
