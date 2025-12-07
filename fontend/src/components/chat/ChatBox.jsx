import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, InputGroup, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { FaRobot, FaUser, FaTimes, FaPaperPlane, FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AIAssistant from './AIAssistant';
import MessageBubble from './MessageBubble';
import './ChatBox.css';

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [aiAssistant] = useState(new AIAssistant());
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'Xin chào! Tôi là trợ lý mua sắm của HaruShop. Tôi có thể giúp bạn tìm sản phẩm phù hợp, trả lời câu hỏi về thú cưng, hoặc đưa ra lời khuyên. Bạn cần tôi giúp gì?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Process user message and generate response
  const processMessage = async (userMessage) => {
    setIsTyping(true);
    
    try {
      
      const response = await generateBotResponse(userMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.content,
        products: response.products || [],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      if (response.products && response.products.length > 0) {
        setSuggestedProducts(response.products);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Generate bot response based on user input
  const generateBotResponse = async (userMessage) => {
    // Analyze user intent using AI Assistant
    const analysis = aiAssistant.analyzeIntent(userMessage);
    
    // Always try to search for products if user mentions any product-related terms
    if (analysis.intent === 'search' || analysis.intent === 'price' || analysis.intent === 'rating' || 
        analysis.intent === 'care' || analysis.productType || analysis.petType) {
      return await handleProductSearch(userMessage, analysis);
    }
    
    // Handle greeting
    if (analysis.intent === 'greeting') {
      return {
        content: aiAssistant.generateResponse(analysis.intent, analysis),
        products: []
      };
    }
    
    // Handle thanks
    if (analysis.intent === 'thanks') {
      return {
        content: aiAssistant.generateResponse(analysis.intent, analysis),
        products: []
      };
    }
    
    // For other cases, try to search anyway if the message seems product-related
    if (userMessage.length > 2) {
      const searchResult = await handleProductSearch(userMessage, analysis);
      if (searchResult.products && searchResult.products.length > 0) {
        return searchResult;
      }
    }
    
    // Default response with follow-up questions
    const response = aiAssistant.generateResponse(analysis.intent, analysis);
    const followUpQuestions = aiAssistant.generateFollowUpQuestions(analysis);
    let content = response;
    
    if (followUpQuestions.length > 0) {
      content += '\n\n' + followUpQuestions.join('\n');
    }
    
    return {
      content: content,
      products: []
    };
  };

  // Handle product search using new AI Assistant
  const handleProductSearch = async (userMessage, analysis = null) => {
    try {
      
      let products = [];
      let content = '';
      
      // Use AI Assistant to search products
      if (analysis && analysis.intent === 'price') {
        // Search by price range
        products = await aiAssistant.searchProductsByPrice(analysis, userMessage);
        content = aiAssistant.generateSearchResponse(analysis, products, userMessage);
      } else {
        // Regular product search
        products = await aiAssistant.searchProducts(analysis, userMessage);
        content = aiAssistant.generateSearchResponse(analysis, products, userMessage);
      }
      
      // If no products found, get contextual recommendations
      if (products.length === 0) {
        products = await aiAssistant.getContextualRecommendations(analysis);
        content = aiAssistant.generateNoResultsResponse(analysis, userMessage);
      }
      
      
      return {
        content: content,
        products: products
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        content: 'Xin lỗi, tôi không thể tìm kiếm sản phẩm lúc này. Vui lòng thử lại sau.',
        products: []
      };
    }
  };


  // Get product image URL - now handled by ProductService
  const getProductImageUrl = (item) => {
    return item.imageUrl || null;
  };

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Process message
    processMessage(inputMessage);
  };

  // Handle product click
  const handleProductClick = (product) => {
    let url = '';
    if (product.type === 'food') {
      url = `/foods/${product._id}`;
    } else if (product.type === 'accessory') {
      url = `/accessories/${product.slug || product._id}`;
    } else if (product.type === 'service') {
      url = `/services/${product.slug || product._id}`;
    }
    
    if (url) {
      navigate(url);
      setIsOpen(false);
    }
  };

  // Get type info
  const getTypeInfo = (type) => {
    switch (type) {
      case 'food':
        return { icon: '🍽️', label: 'Đồ ăn', color: '#10b981' };
      case 'accessory':
        return { icon: '🎾', label: 'Phụ kiện', color: '#f59e0b' };
      case 'service':
        return { icon: '🛠️', label: 'Dịch vụ', color: '#8b5cf6' };
      default:
        return { icon: '📦', label: 'Sản phẩm', color: '#6b7280' };
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        size="lg"
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
      </Button>

      {/* Chat Box */}
      {isOpen && (
        <Card className="chat-box">
          <Card.Header className="chat-header">
            <div className="d-flex align-items-center gap-2">
              <FaRobot className="text-primary" />
              <span className="fw-bold">Trợ lý HaruShop</span>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-0 text-muted"
            >
              <FaTimes />
            </Button>
          </Card.Header>

          <Card.Body className="chat-body">
            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-avatar">
                    {message.type === 'user' ? <FaUser /> : <FaRobot />}
                  </div>
                  <div className="message-content">
                    <MessageBubble message={message.content} isUser={message.type === 'user'}>
                      {/* Product suggestions */}
                      {message.products && message.products.length > 0 && (
                      <div className="product-suggestions mt-3">
                        <Row>
                          {message.products.map((product, index) => {
                            const typeInfo = product.typeInfo || getTypeInfo(product.type);
                            return (
                              <Col key={`${product._id}-${index}`} xs={6} className="mb-3">
                                <Card 
                                  className="product-card h-100"
                                  onClick={() => handleProductClick(product)}
                                >
                                  <div className="product-image-container">
                                    {product.imageUrl ? (
                                      <Card.Img
                                        variant="top"
                                        src={product.imageUrl}
                                        className="product-image"
                                      />
                                    ) : (
                                      <div className="product-placeholder">
                                        {typeInfo.icon}
                                      </div>
                                    )}
                                    <Badge
                                      className="product-type-badge"
                                      style={{ backgroundColor: typeInfo.color }}
                                    >
                                      {typeInfo.label}
                                    </Badge>
                                  </div>
                                  
                                  <Card.Body className="p-2">
                                    <Card.Title className="product-title">
                                      {product.name}
                                    </Card.Title>
                                    
                                    <div className="product-info">
                                      <div className="product-price">
                                        {product.formattedPrice}
                                      </div>
                                      
                                      <div className="product-stats">
                                        {product.formattedRating && (
                                          <div className="product-rating">
                                            {product.formattedRating}
                                          </div>
                                        )}
                                        {product.formattedSold && (
                                          <div className="product-sold">
                                            {product.formattedSold}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                      )}
                    </MessageBubble>
                    
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="message bot-message">
                  <div className="message-avatar">
                    <FaRobot />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble typing-indicator">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang tìm kiếm...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </Card.Body>

          <Card.Footer className="chat-footer">
            <Form onSubmit={handleSendMessage}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="chat-input"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!inputMessage.trim() || isTyping}
                >
                  <FaPaperPlane />
                </Button>
              </InputGroup>
            </Form>
          </Card.Footer>
        </Card>
      )}
    </>
  );
};

export default ChatBox;
