import './compact.css';
import './form-flow.css';

export default function EstimateDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="estimate-demo-compact">{children}</div>;
}
