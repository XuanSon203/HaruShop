import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, InputGroup, Modal, Row, Table } from 'react-bootstrap'

function ShippingAdmin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    price: 0,
    phone: '',
    email: '',
    address: '',
    estimated_delivery_time: '2-3 days',
    methods: [],
  })
const API_BASE = `http://${window.location.hostname}:8080`;
  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/shipping`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) setItems(data.items || [])
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(it =>
      it.name?.toLowerCase().includes(q) ||
      it.phone?.toLowerCase().includes(q) ||
      it.email?.toLowerCase().includes(q)
    )
  }, [items, query])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', price: 0, phone: '', email: '', address: '', estimated_delivery_time: '2-3 days', methods: [] })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name || '',
      price: item.price ?? 0,
      phone: item.phone || '',
      email: item.email || '',
      address: Array.isArray(item.address) ? item.address.join(', ') : (item.address || ''),
      estimated_delivery_time: item.estimated_delivery_time || '2-3 days',
      methods: Array.isArray(item.methods) ? item.methods.map(m => ({
        name: m.name || '',
        price: m.price ?? 0,
        estimated_time: m.estimated_time || '',
      })) : [],
    })
    setShowModal(true)
  }

  const save = async () => {
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      address: form.address
        ? form.address.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      methods: Array.isArray(form.methods)
        ? form.methods
            .map(m => ({ name: String(m.name || '').trim(), price: Number(m.price) || 0, estimated_time: m.estimated_time || '' }))
            .filter(m => m.name)
        : [],
    }
    try {
      const url = editing ? `${API_BASE}/admin/shipping/${editing._id}` : `${API_BASE}/admin/shipping`
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        await fetchItems()
      } else {
        alert(data.message || 'Lưu thất bại')
      }
    } catch (e) {
      alert('Lỗi kết nối')
    }
  }

  const removeItem = async (item) => {
    if (!window.confirm('Xóa đơn vị vận chuyển này?')) return
    try {
      const res = await fetch(`${API_BASE}/admin/shipping/${item._id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) fetchItems()
      else alert(data.message || 'Xóa thất bại')
    } catch (e) {
      alert('Lỗi kết nối')
    }
  }

  return (
    <div className="shipping-page">
      <style>{`
        .shipping-page .card:hover,
        .shipping-page .btn:hover,
        .shipping-page .table tr:hover {
          transform: none !important;
          transition: none !important;
        }
      `}</style>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Đơn vị vận chuyển</h3>
        <div className="d-flex gap-2">
          <InputGroup>
            <Form.Control placeholder="Tìm theo tên, email, SĐT" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          <Button onClick={openCreate}>+ Thêm</Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Tên</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Thời gian dự kiến</th>
                <th>Phương thức</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it._id}>
                  <td>{it.name}</td>
                  <td>{it.phone || '—'}</td>
                  <td>{it.email || '—'}</td>
                  <td>{Array.isArray(it.address) ? it.address.join(', ') : (it.address || '—')}</td>
                  <td>{it.estimated_delivery_time || '—'}</td>
                  <td>
                    {Array.isArray(it.methods) && it.methods.length > 0
                      ? it.methods.map(m => `${m.name} (${(m.price||0).toLocaleString('vi-VN')}₫)`).join(', ')
                      : '—'}
                  </td>
                  <td className="text-center">
                    <div className="d-inline-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => openEdit(it)}>Sửa</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => removeItem(it)}>Xóa</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Cập nhật' : 'Thêm mới'} đơn vị vận chuyển</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tên *</Form.Label>
                <Form.Control value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Form.Group>
            </Col>
         
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Địa chỉ (cách nhau bởi dấu phẩy)</Form.Label>
            <Form.Control value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Thời gian giao dự kiến</Form.Label>
            <Form.Control value={form.estimated_delivery_time} onChange={(e) => setForm({ ...form, estimated_delivery_time: e.target.value })} />
          </Form.Group>
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Phương thức vận chuyển</Form.Label>
            <Button size="sm" variant="outline-primary" onClick={() => setForm({ ...form, methods: [...(form.methods || []), { name: '', price: 0, estimated_time: '' }] })}>+ Thêm phương thức</Button>
          </div>
          {Array.isArray(form.methods) && form.methods.length > 0 ? (
            <div className="d-flex flex-column gap-2">
              {form.methods.map((m, idx) => (
                <Row key={idx} className="g-2 align-items-end">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="small">Tên phương thức</Form.Label>
                      <Form.Control value={m.name} onChange={(e) => {
                        const next = [...form.methods];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setForm({ ...form, methods: next });
                      }} />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small">Giá (₫)</Form.Label>
                      <Form.Control type="number" value={m.price} onChange={(e) => {
                        const next = [...form.methods];
                        next[idx] = { ...next[idx], price: e.target.value };
                        setForm({ ...form, methods: next });
                      }} />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small">Thời gian dự kiến</Form.Label>
                      <Form.Control value={m.estimated_time || ''} onChange={(e) => {
                        const next = [...form.methods];
                        next[idx] = { ...next[idx], estimated_time: e.target.value };
                        setForm({ ...form, methods: next });
                      }} />
                    </Form.Group>
                  </Col>
                  <Col md={1} className="text-end">
                    <Button variant="outline-danger" size="sm" onClick={() => {
                      const next = [...form.methods];
                      next.splice(idx, 1);
                      setForm({ ...form, methods: next });
                    }}>Xóa</Button>
                  </Col>
                </Row>
              ))}
            </div>
          ) : (
            <div className="text-muted small">Chưa có phương thức</div>
          )}
        </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={save}>{editing ? 'Cập nhật' : 'Thêm mới'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ShippingAdmin

