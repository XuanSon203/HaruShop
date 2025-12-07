import React, { Suspense } from 'react';
import { Spinner } from 'react-bootstrap';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

// Lazy load Settings component
const Settings = React.lazy(() => import('./Settings'));

const SettingsWrapper = () => {
  return (
    <ErrorBoundary>
      <Suspense 
        fallback={
          <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        }
      >
        <Settings />
      </Suspense>
    </ErrorBoundary>
  );
};

export default SettingsWrapper;
