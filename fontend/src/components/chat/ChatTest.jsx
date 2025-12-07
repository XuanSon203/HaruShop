import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import ProductService from '../../services/ProductService';
import AIAssistant from './AIAssistant';

const ChatTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const productService = new ProductService();
  const aiAssistant = new AIAssistant();

  const runTest = async (testName, testFunction) => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const endTime = Date.now();
      
      setTestResults(prev => [...prev, {
        testName,
        success: true,
        result,
        duration: endTime - startTime,
        timestamp: new Date()
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        testName,
        success: false,
        error: error.message,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testFoodsAPI = () => runTest('Foods API', async () => {
    const products = await productService.searchFoods('thức ăn chó', 3);
    return { count: products.length, products: products.slice(0, 2) };
  });

  const testAccessoriesAPI = () => runTest('Accessories API', async () => {
    const products = await productService.searchAccessories('collar', 3);
    return { count: products.length, products: products.slice(0, 2) };
  });

  const testServicesAPI = () => runTest('Services API', async () => {
    const products = await productService.searchServices('spa', 3);
    return { count: products.length, products: products.slice(0, 2) };
  });

  const testAllProductsAPI = () => runTest('All Products API', async () => {
    const products = await productService.searchAll('thú cưng', 6);
    return { count: products.length, products: products.slice(0, 3) };
  });

  const testPriceRangeAPI = () => runTest('Price Range API', async () => {
    const products = await productService.getProductsByPriceRange(0, 100000, 'all', 4);
    return { count: products.length, products: products.slice(0, 2) };
  });

  const testPopularProductsAPI = () => runTest('Popular Products API', async () => {
    const products = await productService.getPopularProducts('all', 4);
    return { count: products.length, products: products.slice(0, 2) };
  });

  const testAIAnalysis = () => runTest('AI Analysis', async () => {
    const analysis = aiAssistant.analyzeIntent(testQuery || 'tôi cần thức ăn cho chó');
    return analysis;
  });

  const testAISearch = () => runTest('AI Search', async () => {
    const analysis = aiAssistant.analyzeIntent(testQuery || 'tôi cần thức ăn cho chó');
    const products = await aiAssistant.searchProducts(analysis, testQuery || 'tôi cần thức ăn cho chó');
    return { analysis, count: products.length, products: products.slice(0, 2) };
  });

  const runAllTests = async () => {
    setTestResults([]);
    await testFoodsAPI();
    await testAccessoriesAPI();
    await testServicesAPI();
    await testAllProductsAPI();
    await testPriceRangeAPI();
    await testPopularProductsAPI();
    await testAIAnalysis();
    await testAISearch();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <h2>Chat Integration Test</h2>
          <p className="text-muted">Test các API và AI Assistant cho hệ thống chat</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>API Tests</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="primary" onClick={testFoodsAPI} disabled={isLoading}>
                  Test Foods API
                </Button>
                <Button variant="warning" onClick={testAccessoriesAPI} disabled={isLoading}>
                  Test Accessories API
                </Button>
                <Button variant="info" onClick={testServicesAPI} disabled={isLoading}>
                  Test Services API
                </Button>
                <Button variant="success" onClick={testAllProductsAPI} disabled={isLoading}>
                  Test All Products API
                </Button>
                <Button variant="secondary" onClick={testPriceRangeAPI} disabled={isLoading}>
                  Test Price Range API
                </Button>
                <Button variant="dark" onClick={testPopularProductsAPI} disabled={isLoading}>
                  Test Popular Products API
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>AI Assistant Tests</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Test Query</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập câu hỏi để test AI..."
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                />
              </Form.Group>
              <div className="d-grid gap-2">
                <Button variant="primary" onClick={testAIAnalysis} disabled={isLoading}>
                  Test AI Analysis
                </Button>
                <Button variant="success" onClick={testAISearch} disabled={isLoading}>
                  Test AI Search
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Test Results</h5>
              <div>
                <Button variant="success" onClick={runAllTests} disabled={isLoading} className="me-2">
                  Run All Tests
                </Button>
                <Button variant="outline-secondary" onClick={clearResults}>
                  Clear Results
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {isLoading && (
                <Alert variant="info">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Running tests...
                  </div>
                </Alert>
              )}
              
              {testResults.length === 0 ? (
                <p className="text-muted">No test results yet. Click a test button to start.</p>
              ) : (
                <div className="test-results">
                  {testResults.map((result, index) => (
                    <div key={index} className={`mb-3 p-3 border rounded ${result.success ? 'border-success' : 'border-danger'}`}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className={`mb-1 ${result.success ? 'text-success' : 'text-danger'}`}>
                            {result.testName} {result.success ? '✅' : '❌'}
                          </h6>
                          <small className="text-muted">
                            {result.timestamp.toLocaleTimeString('vi-VN')} 
                            {result.duration && ` (${result.duration}ms)`}
                          </small>
                        </div>
                      </div>
                      
                      {result.success ? (
                        <div className="mt-2">
                          <pre className="bg-light p-2 rounded small">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <Alert variant="danger" className="mb-0 py-2">
                            <strong>Error:</strong> {result.error}
                          </Alert>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatTest;

