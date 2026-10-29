import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "/api/foods";

const EMPTY_FORM = {
  foodId: "",
  name: "",
  category: "",
  price: "",
  description: "",
  image: "",
};

function App() {
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestApi(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || `Lỗi HTTP ${response.status}`
      );
    }

    return data;
  }

  async function loadFoods(keyword = "") {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();

      if (keyword.trim()) {
        query.set("search", keyword.trim());
      }

      const url = query.toString()
        ? `${API_URL}?${query.toString()}`
        : API_URL;

      const data = await requestApi(url);

      const list = Array.isArray(data)
        ? data
        : data.foods || data.value || [];

      setFoods(list);
    } catch (err) {
      setError("Không thể tải món ăn: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods("");
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(food) {
    setEditingId(food._id);

    setForm({
      foodId: food.foodId || "",
      name: food.name || "",
      category: food.category || "",
      price: String(food.price ?? ""),
      description: food.description || "",
      image: food.image || "",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const price = Number(form.price);

    if (
      !form.foodId.trim() ||
      !form.name.trim() ||
      !form.category.trim() ||
      form.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Vui lòng nhập đầy đủ thông tin và giá hợp lệ.");
      return;
    }

    const payload = {
      ...form,
      foodId: form.foodId.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      price,
      description: form.description.trim(),
      image: form.image.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await requestApi(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        setMessage("Cập nhật món ăn thành công!");
      } else {
        await requestApi(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        setMessage("Thêm món ăn thành công!");
      }

      resetForm();
      await loadFoods("");
    } catch (err) {
      setError("Không thể lưu món ăn: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(food) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa món "${food.name}" không?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await requestApi(`${API_URL}/${food._id}`, {
        method: "DELETE",
      });

      setMessage("Xóa món ăn thành công!");

      if (editingId === food._id) {
        resetForm();
      }

      await loadFoods(search);
    } catch (err) {
      setError("Không thể xóa món ăn: " + err.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadFoods(search);
  }

  async function handleClearSearch() {
    setSearch("");
    await loadFoods("");
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <span className="hero-label">FOOD MANAGEMENT SYSTEM</span>
          <h1>🍽️ FoodApp</h1>
          <p>Hệ thống quản lý món ăn trên nền tảng đám mây</p>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-number">{foods.length}</span>
              <span className="stat-label">Món ăn hiển thị</span>
            </div>

            <div className="stat-card">
              <span className="stat-number">CRUD</span>
              <span className="stat-label">Quản lý dữ liệu</span>
            </div>

            <div className="stat-card">
              <span className="stat-number">Cloud</span>
              <span className="stat-label">MongoDB Atlas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="notice error-notice" role="alert">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {message && (
          <div className="notice success-notice" role="status">
            <span>✅ {message}</span>
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {editingId ? "UPDATE FOOD" : "FOOD INFORMATION"}
              </span>

              <h2>
                {editingId ? "Cập nhật món ăn" : "Thêm món ăn mới"}
              </h2>

              <p>Nhập thông tin món ăn vào biểu mẫu bên dưới.</p>
            </div>

            {editingId && (
              <button
                type="button"
                className="btn btn-light"
                onClick={resetForm}
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <form className="food-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="foodId">Mã món ăn *</label>
                <input
                  id="foodId"
                  name="foodId"
                  value={form.foodId}
                  onChange={handleChange}
                  placeholder="VD: FOOD001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Tên món ăn *</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nhập tên món ăn"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Danh mục *</label>
                <input
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="VD: Món chính"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Giá tiền (VNĐ) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="VD: 45000"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="image">Đường dẫn hình ảnh</label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/food.jpg"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Mô tả món ăn</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả món ăn..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                    ? "💾 Cập nhật món ăn"
                    : "＋ Thêm món ăn"}
              </button>

              <button
                type="button"
                className="btn btn-light"
                onClick={resetForm}
              >
                Làm mới biểu mẫu
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="section-heading list-heading">
            <div>
              <span className="eyebrow">FOOD DIRECTORY</span>
              <h2>Danh sách món ăn</h2>
              <p>Tra cứu và quản lý dữ liệu món ăn.</p>
            </div>

            <button
              type="button"
              className="btn btn-light"
              onClick={() => loadFoods(search)}
              disabled={loading}
            >
              ↻ Tải lại
            </button>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <span>⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã món, tên hoặc danh mục..."
                aria-label="Tìm kiếm món ăn"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Tìm kiếm
            </button>

            <button
              type="button"
              className="btn btn-light"
              onClick={handleClearSearch}
            >
              Xóa lọc
            </button>
          </form>

          {loading ? (
            <div className="state-message">
              <span className="spinner" />
              <p>Đang tải danh sách món ăn...</p>
            </div>
          ) : foods.length === 0 ? (
            <div className="state-message empty-state">
              <span>🍜</span>
              <h3>Chưa tìm thấy món ăn</h3>
              <p>Thử từ khóa khác hoặc thêm món ăn mới.</p>
            </div>
          ) : (
            <>
              <div className="table-summary">
                Tìm thấy <strong>{foods.length}</strong> món ăn
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Món ăn</th>
                      <th>Mã món</th>
                      <th>Danh mục</th>
                      <th>Giá tiền</th>
                      <th>Mô tả</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {foods.map((food) => (
                      <tr key={food._id}>
                        <td>
                          <div className="food-name-cell">
                            {food.image ? (
                              <img
                                src={food.image}
                                alt={food.name}
                                className="food-thumb"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="food-placeholder">🍽️</span>
                            )}

                            <strong>{food.name}</strong>
                          </div>
                        </td>

                        <td>
                          <span className="food-code">{food.foodId}</span>
                        </td>

                        <td>
                          <span className="category-badge">
                            {food.category}
                          </span>
                        </td>

                        <td className="price-cell">
                          {Number(food.price).toLocaleString("vi-VN")} ₫
                        </td>

                        <td className="description-cell">
                          {food.description || "Chưa có mô tả"}
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn-icon edit-button"
                              onClick={() => handleEdit(food)}
                              title="Sửa món ăn"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="btn-icon delete-button"
                              onClick={() => handleDelete(food)}
                              title="Xóa món ăn"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <footer className="footer">
          <span>🍽️ FoodApp</span>
          <span>React · Node.js · Express · MongoDB Atlas</span>
        </footer>
      </main>
    </div>
  );
}

export default App;