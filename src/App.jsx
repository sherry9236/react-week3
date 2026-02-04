import { useState } from "react";
import axios from "axios";

import "./assets/style.css";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // 登入狀態管理(控制顯示登入或產品頁）
  const [isAuth, setIsAuth] = useState(false);

  const inputChange = (e) => {
    const { name, value } = e.target;
    setFormData((preData) => ({
      ...preData,
      [name]: value,
    }));
  };

  // 目前選中的產品
  const [products, setProducts] = useState([]);
  // 產品資料狀態
  const [tempProduct, setTempProduct] = useState();

  const getProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      // console.log(response);
      setProducts(response.data.products);
    } catch (error) {
      console.log(error);
    }
  };

  // 登入
  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      // console.log(response.data);

      // 設定cookie
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common["Authorization"] = token;

      getProducts();
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      console.log(error);
    }
  };

  // 確認是否登入
  const checkLogin = async () => {
    try {
      // 讀取cookie
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hexToken="))
        ?.split("=")[1];
      axios.defaults.headers.common["Authorization"] = token;

      const response = await axios.post(`${API_BASE}/api/user/check`);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {!isAuth ? (
        <div className="container login">
          <h1>請先登入</h1>
          <form className="form-floating" onSubmit={onSubmit}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                name="username"
                placeholder="name@example.com"
                value={formData.username}
                onChange={inputChange}
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={inputChange}
              />
              <label htmlFor="password">Password</label>
            </div>
            <button
              type="submit"
              className="btn btn-primary mt-2"
              style={{ width: "100%" }}
            >
              登入
            </button>
          </form>
        </div>
      ) : (
        <div className="container">
          <div className="container">
            <div className="row mt-2">
              <div className="col-md-6">
                <button
                  type="button"
                  className="btn btn-danger mb-5"
                  onClick={checkLogin}
                >
                  確認是否登入
                </button>
                <h2>產品列表</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>產品名稱</th>
                      <th>原價</th>
                      <th>售價</th>
                      <th>是否啟用</th>
                      <th>查看細節</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item) => (
                      <tr key={item.id}>
                        <th>{item.title}</th>
                        <td>{item.origin_price}</td>
                        <td>{item.price}</td>
                        <td>{item.is_enabled ? "啟用" : "未啟用"}</td>
                        <td>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setTempProduct(item);
                            }}
                          >
                            查看細節
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {
                <div className="col-md-6">
                  <h2>單一產品細節</h2>
                  {tempProduct ? (
                    <div className="card mb-3">
                      <img
                        src={tempProduct.imageUrl}
                        className="card-img-top primary-image .img-fluid"
                        style={{ width: "300px" }}
                        alt="主圖"
                      />
                      <div className="card-body">
                        <h5 className="card-title">
                          {tempProduct.title}
                          <span className="badge bg-primary ms-2">
                            {tempProduct.category}
                          </span>
                        </h5>
                        <p className="card-text">
                          商品描述：{tempProduct.description}
                        </p>
                        <p className="card-text">
                          商品內容：{tempProduct.content}
                        </p>
                        <div className="d-flex">
                          <p className="card-text text-secondary">
                            <del>{tempProduct.origin_price}</del>
                          </p>
                          元 / {tempProduct.price} 元
                        </div>
                        <h5 className="mt-3">更多圖片：</h5>
                        <div className="d-flex flex-wrap">
                          {tempProduct.imagesUrl.map((imgUrl, index) => {
                            return (
                              <img
                                key={index}
                                src={imgUrl}
                                style={{ height: "100px", margin: "5px" }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary">請選擇一個商品查看</p>
                  )}
                </div>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;