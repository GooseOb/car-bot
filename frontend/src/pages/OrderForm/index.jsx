import { useState } from "react";
import { useParams } from "react-router";
import styles from "./styles.module.css";

export const OrderForm = () => {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`/api/order/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone }),
      });

      alert("Данные отправлены в Telegram!");
    } catch (err) {
      alert(err.response.data.error || "Ошибка отправки данных");
    }
  };

  return (
    <>
      <h1 className={styles.title}>Order #{id}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Send
        </button>
      </form>
    </>
  );
};
