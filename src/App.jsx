import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as bootstrap from 'bootstrap';

import "./assets/style.css";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // 登入狀態管理(控制顯示登入或產品頁）
  const [isAuth, setIsAuth] = useState(false);

  const inputChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData((preData) => ({
    ...preData,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: value,
    }));
  };

  const handleModalImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl]
      newImage[index] = value
      return {
        ...pre,
        imagesUrl: newImage
      }
    });
  };

  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl]
      newImage.push("");
      return {
        ...pre,
        imagesUrl: newImage,
      };
    });
  };

  const handleRemoveImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl]
      newImage.pop();
      return {
        ...pre,
        imagesUrl: newImage
      };
    });
  };

  // 目前選中的產品
  const [products, setProducts] = useState([]);
  // 產品資料狀態
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  const productModalRef = useRef(null)

  const getProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      // console.log(response);
      setProducts(response.data.products);
    } catch (error) {
      console.log(error);
    }
  };

  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`
    let method = 'post'

    if (modalType === 'edit') {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`
      method = 'put'
    }

    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter(url => url !== "")],
      },
    };

    try {
      const response = await axios[method](url, productData);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  };

  const delProduct = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  }

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

  useEffect(() => {
    // 讀取cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];
    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
    }

    productModalRef.current = new bootstrap.Modal('#productModal', {
      keyboard: false
    })

    // 確認是否登入
    const checkLogin = async () => {
      try {
        const response = await axios.post(`${API_BASE}/api/user/check`);
        console.log(response.data);

        setIsAuth(true);
        getProducts();

      } catch (error) {
        console.log(error);
      }
    };

    checkLogin();
  }, []);

  const openModal = (type, product) => {
    setModalType(type)
    setTemplateProduct((pre) => ({
      ...pre,
      ...product,
    }));
    productModalRef.current.show();
  };

  const closeModal = () => {
    productModalRef.current.hide();
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
          <h2>產品列表</h2>
          <div className="text-end mt-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}>
              建立新的產品
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>產品名稱</th>
                <th>分類</th>
                <th>原價</th>
                <th>售價</th>
                <th>是否啟用</th>
                <th>編輯</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <th>{item.title}</th>
                  <td>{item.origin_price}</td>
                  <td>{item.price}</td>
                  <td className={`${item.is_enabled && "text-success"}`}>{item.is_enabled ? "啟用" : "未啟用"}</td>
                  <td>
                    <div className="btn-group" role="group" aria-label="Basic example">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openModal("edit", item)}>編輯</button>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => openModal('delete', item)}>刪除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" aria-hidden="true" ref={productModalRef}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}>
              <h5 id="productModalLabel" className="modal-title">
                <span>{modalType === 'delete' ? '刪除' :
                  modalType === 'edit' ? '編輯' : '新增'}產品</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {
                modalType === 'delete' ? (
                  <p className="fs-4">
                    確定要刪除
                    <span className="text-danger">{templateProduct.title}</span>嗎？
                  </p>) : (
                  <div className="row">
                    <div className="col-sm-4">
                      <div className="mb-2">
                        <div className="mb-3">
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            id="imageUrl"
                            name="imageUrl"
                            className="form-control"
                            placeholder="請輸入圖片連結"
                            value={templateProduct.imageUrl}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                        {
                          templateProduct.imageUrl && (
                            <img className="img-fluid" src={templateProduct.imageUrl} alt="主圖" />
                          )
                        }
                      </div>
                      <div>
                        {templateProduct.imagesUrl.map((url, index) => (
                          <div key={index}>
                            <label htmlFor="imageUrl" className="form-label">
                              輸入圖片網址
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`圖片網址${index + 1}`}
                              value={url}
                              onChange={(e) => handleModalImageChange(index, e.target.value)}
                            />
                            {url && (
                              <img
                                className="img-fluid"
                                src={url}
                                alt={`副圖${index + 1}`}
                              />
                            )}
                          </div>
                        ))}
                        <button className="btn btn-outline-primary btn-sm d-block w-100"
                          onClick={() => handleAddImage()}>
                          新增圖片
                        </button>
                      </div>
                      <div>
                        <button className="btn btn-outline-danger btn-sm d-block w-100"
                          onClick={() => handleRemoveImage()}>
                          刪除圖片
                        </button>
                      </div>
                    </div>
                    <div className="col-sm-8">
                      <div className="mb-3">
                        <label htmlFor="title" className="form-label">標題</label>
                        <input
                          name="title"
                          id="title"
                          type="text"
                          className="form-control"
                          placeholder="請輸入標題"
                          value={templateProduct.title}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="category" className="form-label">分類</label>
                          <input
                            name="category"
                            id="category"
                            type="text"
                            className="form-control"
                            placeholder="請輸入分類"
                            value={templateProduct.category}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="unit" className="form-label">單位</label>
                          <input
                            name="unit"
                            id="unit"
                            type="text"
                            className="form-control"
                            placeholder="請輸入單位"
                            value={templateProduct.unit}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="origin_price" className="form-label">原價</label>
                          <input
                            name="origin_price"
                            id="origin_price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入原價"
                            value={templateProduct.origin_price}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="price" className="form-label">售價</label>
                          <input
                            name="price"
                            id="price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入售價"
                            value={templateProduct.price}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                      </div>
                      <hr />

                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">產品描述</label>
                        <textarea
                          name="description"
                          id="description"
                          className="form-control"
                          placeholder="請輸入產品描述"
                          value={templateProduct.description}
                          onChange={(e) => handleModalInputChange(e)}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="content" className="form-label">說明內容</label>
                        <textarea
                          name="content"
                          id="content"
                          className="form-control"
                          placeholder="請輸入說明內容"
                          value={templateProduct.content}
                          onChange={(e) => handleModalInputChange(e)}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            name="is_enabled"
                            id="is_enabled"
                            className="form-check-input"
                            type="checkbox"
                            checked={templateProduct.is_enabled}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                          <label className="form-check-label" htmlFor="is_enabled">
                            是否啟用
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </div>
            <div className="modal-footer">
              {
                modalType === 'delete' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}
                >
                  刪除
                </button>) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      data-bs-dismiss="modal"
                      onClick={() => closeModal()}
                    >
                      取消
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => updateProduct(templateProduct.id)}>確認</button>
                  </>
                )
              }
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

export default App;