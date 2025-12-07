import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Button, Alert, Badge, Spinner } from "react-bootstrap";
import axios from "axios";

const TestRealTime = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    connectToRealTime();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const connectToRealTime = () => {
    try {
      const eventSource = new EventSource('/api/admin/realtime/tracking');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              break;
              
            case 'initial_data':
              setActivities(data.data || []);
              break;
              
            case 'new_activity':
              setActivities(prev => [data.data, ...prev.slice(0, 49)]);
              break;
              
            case 'data_update':
              break;
              
            case 'ping':
              break;
              
            default:
          }
        } catch (error) {
          console.error('❌ Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        setConnectionStatus('error');
        
        // Retry after 3 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connectToRealTime();
          }
        }, 3000);
      };

    } catch (error) {
      console.error('❌ Error creating SSE connection:', error);
      setConnectionStatus('error');
    }
  };

  const testSingleActivity = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/test/realtime');
    } catch (error) {
      console.error('❌ Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testBulkActivities = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/admin/test/realtime/bulk', { count: 10 });
    } catch (error) {
      console.error('❌ Bulk test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const getActionBadgeVariant = (action) => {
    switch (action) {
      case 'created': return 'success';
      case 'updated': return 'primary';
      case 'deleted': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="container-fluid">
      <h1 className="mb-4">🧪 Test Real-time Tracking System</h1>
      
      {/* Connection Status */}
      <Row className="mb-4">
        <Col md={12}>
          <Alert variant={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'danger' : 'warning'}>
            <div className="d-flex align-items-center">
              <strong>Trạng thái kết nối:</strong>
              <Badge bg={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'danger' : 'warning'} className="ms-2">
                {connectionStatus === 'connected' ? 'Đã kết nối' : connectionStatus === 'error' ? 'Lỗi kết nối' : 'Đang kết nối...'}
              </Badge>
              <span className="ms-3">
                <strong>Hoạt động nhận được:</strong> {activities.length}
              </span>
            </div>
          </Alert>
        </Col>
      </Row>

      {/* Test Buttons */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>🧪 Test Functions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  onClick={testSingleActivity}
                  disabled={isLoading || connectionStatus !== 'connected'}
                >
                  {isLoading ? <Spinner size="sm" className="me-2" /> : null}
                  Test Single Activity
                </Button>
                
                <Button 
                  variant="success" 
                  onClick={testBulkActivities}
                  disabled={isLoading || connectionStatus !== 'connected'}
                >
                  {isLoading ? <Spinner size="sm" className="me-2" /> : null}
                  Test Bulk Activities (10)
                </Button>
                
                <Button 
                  variant="info" 
                  onClick={connectToRealTime}
                  disabled={connectionStatus === 'connected'}
                >
                  Reconnect
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>📊 Statistics</h5>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-4">
                  <h3 className="text-primary">{activities.length}</h3>
                  <small>Total Activities</small>
                </div>
                <div className="col-4">
                  <h3 className="text-success">
                    {activities.filter(a => a.action === 'created').length}
                  </h3>
                  <small>Created</small>
                </div>
                <div className="col-4">
                  <h3 className="text-warning">
                    {activities.filter(a => a.action === 'updated').length}
                  </h3>
                  <small>Updated</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Activities List */}
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>🔄 Real-time Activities</h5>
            </Card.Header>
            <Card.Body>
              {activities.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <p>Chưa có hoạt động nào. Hãy thử test functions ở trên.</p>
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {activities.map((activity, index) => (
                    <div key={activity.id || index} className="border-bottom py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <Badge bg={getActionBadgeVariant(activity.action)} className="me-2">
                              {activity.actionName}
                            </Badge>
                            <strong>{activity.entity}:</strong>
                            <span className="ms-1">{activity.entityName}</span>
                          </div>
                          {activity.user && (
                            <small className="text-muted">
                              👤 {activity.user.fullName} ({activity.user.userName})
                            </small>
                          )}
                          <br />
                          <small className="text-muted">
                            📝 {activity.details?.description}
                          </small>
                        </div>
                        <div className="text-end">
                          <small className="text-muted">
                            {formatTimestamp(activity.timestamp)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TestRealTime;



