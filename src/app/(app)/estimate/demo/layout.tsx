import './compact.css';
import './form-flow.css';
import './item-inline-table.css';
import './dense-operations.css';
import './review-cleanup.css';
import './listing-single-header.css';
import './inapp-estimate-flow.css';
import './business-ui.css';
import './received-list-detail.css';
import EstimateDemoWorkspace from './EstimateDemoWorkspace';

export default function EstimateDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="estimate-demo-compact">
      <EstimateDemoWorkspace>{children}</EstimateDemoWorkspace>
    </div>
  );
}
