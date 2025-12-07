import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Alert, Button, ButtonGroup, Card, Spinner } from 'react-bootstrap';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

function Revenue() {
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState({
    labels: [],
    productRevenue: [],
    productOrders: [],
    serviceRevenue: [],
    serviceOrders: [],
    productTotalRevenue: 0,
    productTotalOrders: 0,
    serviceTotalRevenue: 0,
    serviceTotalOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    // Dữ liệu chi tiết cho đồ ăn và phụ kiện
    foodRevenue: [],
    foodOrders: [],
    foodTotalRevenue: 0,
    foodTotalOrders: 0,
    accessoryRevenue: [],
    accessoryOrders: [],
    accessoryTotalRevenue: 0,
    accessoryTotalOrders: 0,
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  const sumArray = (arr = []) =>
    arr.reduce((total, value) => total + Number(value || 0), 0);

  const fetchRevenueData = async (selectedPeriod) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(
        `${API_BASE}/admin/reverse/revenue?period=${selectedPeriod}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải dữ liệu doanh thu');
      }
      const productRevenueSum = sumArray(data.productRevenue);
      const serviceRevenueSum = sumArray(data.serviceRevenue);
      const productOrdersSum = sumArray(data.productOrders);
      const serviceOrdersSum = sumArray(data.serviceOrders);
      const foodRevenueSum = sumArray(data.foodRevenue);
      const foodOrdersSum = sumArray(data.foodOrders);
      const accessoryRevenueSum = sumArray(data.accessoryRevenue);
      const accessoryOrdersSum = sumArray(data.accessoryOrders);

      const computedTotals = {
        productTotalRevenue: productRevenueSum,
        productTotalOrders: productOrdersSum,
        serviceTotalRevenue: serviceRevenueSum,
        serviceTotalOrders: serviceOrdersSum,
        foodTotalRevenue: foodRevenueSum,
        foodTotalOrders: foodOrdersSum,
        accessoryTotalRevenue: accessoryRevenueSum,
        accessoryTotalOrders: accessoryOrdersSum,
      };

      const totalRevenue =
        foodRevenueSum + accessoryRevenueSum + serviceRevenueSum;
      const totalOrders =
        foodOrdersSum + accessoryOrdersSum + serviceOrdersSum;

      setChartData({
        labels: data.labels || [],
        productRevenue: data.productRevenue || [],
        productOrders: data.productOrders || [],
        serviceRevenue: data.serviceRevenue || [],
        serviceOrders: data.serviceOrders || [],
        productTotalRevenue:
          data.productTotalRevenue ?? computedTotals.productTotalRevenue,
        productTotalOrders:
          data.productTotalOrders ?? computedTotals.productTotalOrders,
        serviceTotalRevenue:
          data.serviceTotalRevenue ?? computedTotals.serviceTotalRevenue,
        serviceTotalOrders:
          data.serviceTotalOrders ?? computedTotals.serviceTotalOrders,
        totalRevenue: data.totalRevenue ?? totalRevenue,
        totalOrders: data.totalOrders ?? totalOrders,
        // Dữ liệu chi tiết
        foodRevenue: data.foodRevenue || [],
        foodOrders: data.foodOrders || [],
        foodTotalRevenue:
          data.foodTotalRevenue ?? computedTotals.foodTotalRevenue,
        foodTotalOrders:
          data.foodTotalOrders ?? computedTotals.foodTotalOrders,
        accessoryRevenue: data.accessoryRevenue || [],
        accessoryOrders: data.accessoryOrders || [],
        accessoryTotalRevenue:
          data.accessoryTotalRevenue ?? computedTotals.accessoryTotalRevenue,
        accessoryTotalOrders:
          data.accessoryTotalOrders ?? computedTotals.accessoryTotalOrders,
      });
    } catch (err) {
      console.error('Error fetching revenue:', err);
      setError(err.message || 'Lỗi tải dữ liệu doanh thu');
      setChartData({
        labels: [],
        productRevenue: [],
        productOrders: [],
        serviceRevenue: [],
        serviceOrders: [],
        productTotalRevenue: 0,
        productTotalOrders: 0,
        serviceTotalRevenue: 0,
        serviceTotalOrders: 0,
        totalRevenue: 0,
        totalOrders: 0,
        foodRevenue: [],
        foodOrders: [],
        foodTotalRevenue: 0,
        foodTotalOrders: 0,
        accessoryRevenue: [],
        accessoryOrders: [],
        accessoryTotalRevenue: 0,
        accessoryTotalOrders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData(period);
  }, [period]);

  // Chart data cho doanh thu đơn sản phẩm
  const productRevenueData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Doanh thu đơn sản phẩm (VND)',
        data: chartData.productRevenue,
        backgroundColor: 'rgba(13, 110, 253, 0.6)',
        borderColor: 'rgba(13, 110, 253, 1)',
        borderWidth: 2,
        tension: 0.4,
      }
    ]
  };

  // Chart data cho doanh thu đơn đặt lịch
  const serviceRevenueData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Doanh thu đơn đặt lịch (VND)',
        data: chartData.serviceRevenue,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        tension: 0.4,
      }
    ]
  };

  // Chart data cho số lượng đơn sản phẩm
  const productOrdersData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Số lượng đơn sản phẩm',
        data: chartData.productOrders,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
      }
    ]
  };

  // Chart data cho số lượng đơn đặt lịch
  const serviceOrdersData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Số lượng đơn đặt lịch',
        data: chartData.serviceOrders,
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        tension: 0.4,
      }
    ]
  };

  // Options cho biểu đồ doanh thu
  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Doanh thu: ${Number(context.parsed.y).toLocaleString('vi-VN')} ₫`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return Number(value).toLocaleString('vi-VN') + ' ₫';
          }
        },
        title: {
          display: true,
          text: 'Doanh thu (VND)'
        }
      },
      x: {
        ticks: {
          maxRotation: period === 'week' ? 45 : period === 'day' ? 45 : 0,
          minRotation: period === 'week' ? 45 : period === 'day' ? 45 : 0,
          font: {
            size: period === 'day' ? 10 : 12
          },
          autoSkip: true,
          maxTicksLimit: period === 'week' ? 28 : period === 'day' ? 7 : undefined
        }
      }
    }
  };

  // Options cho biểu đồ số lượng đơn
  const ordersOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Số lượng: ${Number(context.parsed.y).toLocaleString('vi-VN')} đơn`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return Number(value).toLocaleString('vi-VN');
          },
          stepSize: 1
        },
        title: {
          display: true,
          text: 'Số lượng đơn hàng'
        }
      },
      x: {
        ticks: {
          maxRotation: period === 'week' ? 45 : period === 'day' ? 45 : 0,
          minRotation: period === 'week' ? 45 : period === 'day' ? 45 : 0,
          font: {
            size: period === 'day' ? 10 : 12
          },
          autoSkip: true,
          maxTicksLimit: period === 'week' ? 28 : period === 'day' ? 7 : undefined
        }
      }
    }
  };

  const periodLabels = {
    day: 'Theo ngày (7 ngày gần nhất)',
    week: 'Theo tuần (4 tuần gần nhất)',
    month: 'Theo tháng (12 tháng gần nhất)',
    year: 'Theo năm (5 năm gần nhất)'
  };

  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* White card container với header cam */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header với màu cam */}
        <div style={{ 
          backgroundColor: '#fd7e14', 
          padding: '15px 20px'
        }}>
          <h5 className="mb-0 text-white fw-bold">
            Thống kê doanh thu
          </h5>
        </div>

        {/* Content area */}
        <div style={{ 
          padding: '15px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
        {/* Period selector */}
        <div className="mb-4">
          <div className="mb-2">
            <span className="fw-semibold">Chọn khoảng thời gian:</span>
          </div>
          <div className="mb-2 text-muted small">
            {periodLabels[period]}
          </div>
          <ButtonGroup>
            <Button
              variant={period === 'day' ? 'warning' : 'outline-warning'}
              onClick={() => setPeriod('day')}
              size="sm"
              style={period === 'day' ? {
                backgroundColor: '#fd7e14',
                borderColor: '#fd7e14',
                color: 'white'
              } : {
                borderColor: '#0d6efd',
                color: '#0d6efd'
              }}
            >
              Ngày
            </Button>
            <Button
              variant={period === 'week' ? 'warning' : 'outline-warning'}
              onClick={() => setPeriod('week')}
              size="sm"
              style={period === 'week' ? {
                backgroundColor: '#fd7e14',
                borderColor: '#fd7e14',
                color: 'white'
              } : {
                borderColor: '#0d6efd',
                color: '#0d6efd'
              }}
            >
              Tuần
            </Button>
            <Button
              variant={period === 'month' ? 'warning' : 'outline-warning'}
              onClick={() => setPeriod('month')}
              size="sm"
              style={period === 'month' ? {
                backgroundColor: '#fd7e14',
                borderColor: '#fd7e14',
                color: 'white'
              } : {
                borderColor: '#0d6efd',
                color: '#0d6efd'
              }}
            >
              Tháng
            </Button>
            <Button
              variant={period === 'year' ? 'warning' : 'outline-warning'}
              onClick={() => setPeriod('year')}
              size="sm"
              style={period === 'year' ? {
                backgroundColor: '#fd7e14',
                borderColor: '#fd7e14',
                color: 'white'
              } : {
                borderColor: '#0d6efd',
                color: '#0d6efd'
              }}
            >
              Năm
            </Button>
          </ButtonGroup>
        </div>

        {/* Summary cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <Card style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small mb-1">Tổng doanh thu</div>
                    <div className="h5 mb-0 text-success fw-bold">
                      {Number(chartData.totalRevenue).toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-muted small mt-1">
                      Đồ ăn: {Number(chartData.foodTotalRevenue || 0).toLocaleString('vi-VN')} ₫ | 
                      Phụ kiện: {Number(chartData.accessoryTotalRevenue || 0).toLocaleString('vi-VN')} ₫ | 
                      DV: {Number(chartData.serviceTotalRevenue).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small mb-1">Tổng số đơn hàng</div>
                    <div className="h5 mb-0 text-primary fw-bold">
                      {chartData.totalOrders.toLocaleString('vi-VN')}
                    </div>
                    <div className="text-muted small mt-1">
                      Đồ ăn: {chartData.foodTotalOrders || 0} | 
                      Phụ kiện: {chartData.accessoryTotalOrders || 0} | 
                      DV: {chartData.serviceTotalOrders}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card style={{ 
              backgroundColor: '#e3f2fd', 
              border: '1px solid #2196f3',
              borderRadius: '4px'
            }}>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small mb-1">Doanh thu đơn sản phẩm</div>
                    <div className="h5 mb-0 text-primary fw-bold">
                      {Number(chartData.productTotalRevenue).toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-muted small mt-1">
                      {chartData.productTotalOrders} đơn hàng
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card style={{ 
              backgroundColor: '#fce4ec', 
              border: '1px solid #e91e63',
              borderRadius: '4px'
            }}>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small mb-1">Doanh thu đơn đặt lịch</div>
                    <div className="h5 mb-0 text-danger fw-bold">
                      {Number(chartData.serviceTotalRevenue).toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-muted small mt-1">
                      {chartData.serviceTotalOrders} đơn hàng
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Charts */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-3 text-muted">Đang tải dữ liệu...</div>
          </div>
        ) : chartData.labels.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-info-circle me-2"></i>
            Không có dữ liệu doanh thu trong khoảng thời gian này
          </Alert>
        ) : (
          <div className="row g-4">
            {/* Biểu đồ 1: Doanh thu đơn sản phẩm */}
            <div className="col-md-6">
              <Card style={{ 
                backgroundColor: 'white', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                height: '100%'
              }}>
                <Card.Header style={{ backgroundColor: '#e3f2fd', borderBottom: '2px solid #2196f3' }}>
                  <h6 className="mb-0 fw-bold text-primary">Doanh thu đơn sản phẩm</h6>
                </Card.Header>
                <Card.Body>
                  <div style={{ 
                    height: '350px', 
                    position: 'relative',
                    width: '100%'
                  }}>
                    {period === 'week' ? (
                      <Line data={productRevenueData} options={revenueOptions} />
                    ) : (
                      <Bar data={productRevenueData} options={revenueOptions} />
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Biểu đồ 2: Doanh thu đơn đặt lịch */}
            <div className="col-md-6">
              <Card style={{ 
                backgroundColor: 'white', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                height: '100%'
              }}>
                <Card.Header style={{ backgroundColor: '#fce4ec', borderBottom: '2px solid #e91e63' }}>
                  <h6 className="mb-0 fw-bold text-danger">Doanh thu đơn đặt lịch</h6>
                </Card.Header>
                <Card.Body>
                  <div style={{ 
                    height: '350px', 
                    position: 'relative',
                    width: '100%'
                  }}>
                    {period === 'week' ? (
                      <Line data={serviceRevenueData} options={revenueOptions} />
                    ) : (
                      <Bar data={serviceRevenueData} options={revenueOptions} />
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Biểu đồ 3: Số lượng đơn sản phẩm */}
            <div className="col-md-6">
              <Card style={{ 
                backgroundColor: 'white', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                height: '100%'
              }}>
                <Card.Header style={{ backgroundColor: '#e8f5e9', borderBottom: '2px solid #4caf50' }}>
                  <h6 className="mb-0 fw-bold text-success">Số lượng đơn sản phẩm</h6>
                </Card.Header>
                <Card.Body>
                  <div style={{ 
                    height: '350px', 
                    position: 'relative',
                    width: '100%'
                  }}>
                    {period === 'week' ? (
                      <Line data={productOrdersData} options={ordersOptions} />
                    ) : (
                      <Bar data={productOrdersData} options={ordersOptions} />
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Biểu đồ 4: Số lượng đơn đặt lịch */}
            <div className="col-md-6">
              <Card style={{ 
                backgroundColor: 'white', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                height: '100%'
              }}>
                <Card.Header style={{ backgroundColor: '#fff3e0', borderBottom: '2px solid #ff9800' }}>
                  <h6 className="mb-0 fw-bold text-warning">Số lượng đơn đặt lịch</h6>
                </Card.Header>
                <Card.Body>
                  <div style={{ 
                    height: '350px', 
                    position: 'relative',
                    width: '100%'
                  }}>
                    {period === 'week' ? (
                      <Line data={serviceOrdersData} options={ordersOptions} />
                    ) : (
                      <Bar data={serviceOrdersData} options={ordersOptions} />
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default Revenue;
