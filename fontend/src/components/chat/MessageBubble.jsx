import React, { useState } from 'react';

const MessageBubble = ({ message, isUser, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLongMessage, setIsLongMessage] = useState(false);

  // Check if message is long (more than 150 characters or 4 lines)
  const checkIfLongMessage = (text) => {
    if (!text) return false;
    const lines = text.split('\n');
    const hasLongLines = lines.some(line => line.length > 80);
    return text.length > 150 || lines.length > 4 || hasLongLines;
  };

  // Split message into lines for preview
  const getPreviewText = (text, maxLines = 4) => {
    if (!text) return '';
    const lines = text.split('\n');
    if (lines.length <= maxLines) return text;
    
    // Truncate long lines
    const truncatedLines = lines.slice(0, maxLines).map(line => {
      if (line.length > 80) {
        return line.substring(0, 80) + '...';
      }
      return line;
    });
    
    return truncatedLines.join('\n');
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Check if message is long when component mounts
  React.useEffect(() => {
    if (message && checkIfLongMessage(message)) {
      setIsLongMessage(true);
    }
  }, [message]);

  if (!message) return null;

  const shouldShowExpand = isLongMessage && !isExpanded;
  const displayText = shouldShowExpand ? getPreviewText(message) : message;

  return (
    <div className={`message-bubble ${isLongMessage ? 'long-message' : ''} ${isExpanded ? 'expanded' : ''}`}>
      {shouldShowExpand ? (
        <div className="message-preview">
          {displayText}
        </div>
      ) : (
        <div className="message-text">
          {message}
        </div>
      )}
      
      {shouldShowExpand && (
        <button 
          className="expand-button"
          onClick={handleExpand}
        >
          Xem thêm...
        </button>
      )}
      
      {isExpanded && (
        <button 
          className="expand-button"
          onClick={handleExpand}
        >
          Thu gọn
        </button>
      )}
      
      {children}
    </div>
  );
};

export default MessageBubble;
