import React, { useState } from 'react';
import { Card, Button, Form, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FaRobot, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import AIAssistant from './AIAssistant';
import ProductService from '../../services/ProductService';

const ChatIntegrationTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [aiAssistant] = useState(new AIAssistant());
  const [productService] = useState(new ProductService());

  const testCases = [
    {
      name: "Tìm kiếm thức ăn cho chó",
      input: "tôi cần thức ăn cho chó",
      expectedType: "food",
      expectedPet: "dog"
    },
    {
      name: "Tìm kiếm phụ kiện cho mèo",
      input: "cần phụ kiện cho mèo",
      expectedType: "accessory",
      expectedPet: "cat"
    },
    {
      name: "Tìm kiếm dịch vụ spa",
      input: "dịch vụ spa cho thú cưng",
      expectedType: "service"
    },
    {
      name: "Tìm kiếm theo giá rẻ",
      input: "sản phẩm rẻ dưới 100k",
      expectedIntent: "price",
      expectedPriceRange: "cheap"
    },
    {
      name: "Tìm kiếm sản phẩm chất lượng cao",
      input: "sản phẩm tốt nhất cho chó",
      expectedIntent: "rating"
    },
    {
      name: "Tìm kiếm chung",
      input: "có gì cho thú cưng không",
      expectedIntent: "search"
    }
  ];

  const runSingleTest = async (testCase) => {
    const startTime = Date.now();
    
    try {
      // Test AI Analysis
      const analysis = aiAssistant.analyzeIntent(testCase.input);
      const analysisTime = Date.now() - startTime;
      
      // Test Product Search
      const searchStartTime = Date.now();
      const products = await aiAssistant.searchProducts(analysis, testCase.input);
      const searchTime = Date.now() - searchStartTime;
      
      // Validate results
      const validation = {
        analysisCorrect: true,
        searchSuccessful: products.length > 0,
        errors: []
      };
      
      if (testCase.expectedType && analysis.productType !== testCase.expectedType) {
        validation.analysisCorrect = false;
        validation.errors.push(`Expected type: ${testCase.expectedType}, got: ${analysis.productType}`);
      }
      
      if (testCase.expectedPet && analysis.petType !== testCase.expectedPet) {
        validation.analysisCorrect = false;
        validation.errors.push(`Expected pet: ${testCase.expectedPet}, got: ${analysis.petType}`);
      }
      
      if (testCase.expectedIntent && analysis.intent !== testCase.expectedIntent) {
        validation.analysisCorrect = false;
        validation.errors.push(`Expected intent: ${testCase.expectedIntent}, got: ${analysis.intent}`);
      }
      
      if (testCase.expectedPriceRange && analysis.priceRange !== testCase.expectedPriceRange) {
        validation.analysisCorrect = false;
        validation.errors.push(`Expected price range: ${testCase.expectedPriceRange}, got: ${analysis.priceRange}`);
      }
      
      return {
        ...testCase,
        status: validation.analysisCorrect && validation.searchSuccessful ? 'success' : 'warning',
        analysis,
        products,
        validation,
        analysisTime,
        searchTime,
        totalTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        ...testCase,
        status: 'error',
        error: error.message,
        totalTime: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results = [];
    
    for (const testCase of testCases) {
      const result = await runSingleTest(testCase);
      results.push(result);
      setTestResults([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  const runSingleTestHandler = async (testCase) => {
    setIsRunning(true);
    const result = await runSingleTest(testCase);
    setTestResults([result]);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <FaCheck className="text-success" />;
      case 'warning':
        return <FaTimes className="text-warning" />;
      case 'error':
        return <FaTimes className="text-danger" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge bg="success">Thành công</Badge>;
      case 'warning':
        return <Badge bg="warning">Cảnh báo</Badge>;
      case 'error':
        return <Badge bg="danger">Lỗi</Badge>;
      default:
        return <Badge bg="secondary">Chưa test</Badge>;
    }
  };

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">
            <FaRobot className="me-2" />
            Test Tích Hợp Chat AI
          </h4>
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="me-2"
            >
              <FaSearch className="me-1" />
              Chạy Tất Cả Test
            </Button>
            <small className="text-muted">
              Test tích hợp AI Assistant và ProductService
            </small>
          </div>

          {/* Test Cases */}
          <Row className="mb-4">
            {testCases.map((testCase, index) => (
              <Col md={6} key={index} className="mb-3">
                <Card>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6>{testCase.name}</h6>
                        <p className="text-muted small mb-2">"{testCase.input}"</p>
                        <div className="small">
                          {testCase.expectedType && (
                            <Badge bg="info" className="me-1">
                              Type: {testCase.expectedType}
                            </Badge>
                          )}
                          {testCase.expectedPet && (
                            <Badge bg="info" className="me-1">
                              Pet: {testCase.expectedPet}
                            </Badge>
                          )}
                          {testCase.expectedIntent && (
                            <Badge bg="info" className="me-1">
                              Intent: {testCase.expectedIntent}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => runSingleTestHandler(testCase)}
                        disabled={isRunning}
                      >
                        Test
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h5>Kết Quả Test</h5>
              {testResults.map((result, index) => (
                <Card key={index} className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      {getStatusIcon(result.status)}
                      <span className="ms-2">{result.name}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <h6>Phân Tích AI:</h6>
                        <ul className="small">
                          <li><strong>Intent:</strong> {result.analysis?.intent}</li>
                          <li><strong>Product Type:</strong> {result.analysis?.productType || 'Không xác định'}</li>
                          <li><strong>Pet Type:</strong> {result.analysis?.petType || 'Không xác định'}</li>
                          <li><strong>Price Range:</strong> {result.analysis?.priceRange || 'Không xác định'}</li>
                          <li><strong>Keywords:</strong> {result.analysis?.keywords?.join(', ')}</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <h6>Kết Quả Tìm Kiếm:</h6>
                        <ul className="small">
                          <li><strong>Số sản phẩm:</strong> {result.products?.length || 0}</li>
                          <li><strong>Thời gian phân tích:</strong> {result.analysisTime}ms</li>
                          <li><strong>Thời gian tìm kiếm:</strong> {result.searchTime}ms</li>
                          <li><strong>Tổng thời gian:</strong> {result.totalTime}ms</li>
                        </ul>
                      </Col>
                    </Row>

                    {result.validation?.errors?.length > 0 && (
                      <Alert variant="warning" className="mt-3">
                        <strong>Cảnh báo:</strong>
                        <ul className="mb-0">
                          {result.validation.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </Alert>
                    )}

                    {result.error && (
                      <Alert variant="danger" className="mt-3">
                        <strong>Lỗi:</strong> {result.error}
                      </Alert>
                    )}

                    {result.products && result.products.length > 0 && (
                      <div className="mt-3">
                        <h6>Sản Phẩm Tìm Được:</h6>
                        <Row>
                          {result.products.slice(0, 3).map((product, i) => (
                            <Col md={4} key={i}>
                              <Card className="small">
                                <Card.Body className="p-2">
                                  <div className="d-flex align-items-center">
                                    <div className="me-2">
                                      {product.type === 'food' && '🍽️'}
                                      {product.type === 'accessory' && '🎾'}
                                      {product.type === 'service' && '🛠️'}
                                    </div>
                                    <div>
                                      <div className="fw-bold">{product.name}</div>
                                      <div className="text-muted">{product.formattedPrice}</div>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ChatIntegrationTest;

