import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

const BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank For Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
];

export default function SettingsTab({ shop, onShopUpdated }) {
  const [description, setDescription] = useState(shop.description || "");
  const [pricesPublic, setPricesPublic] = useState(shop.prices_public);
  const [savingShop, setSavingShop] = useState(false);
  const [shopMessage, setShopMessage] = useState(null);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankMessage, setBankMessage] = useState(null);
  const [bankError, setBankError] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useEffect(() => {
    loadPayoutAccount();
  }, []);

  async function loadPayoutAccount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setBankCode(data.bank_code);
      setAccountNumber(data.account_number);
      setAccountName(data.account_name);
    }
    setLoadingAccount(false);
  }

  async function handleShopSave(e) {
    e.preventDefault();
    setSavingShop(true);
    setShopMessage(null);

    const { error } = await supabase
      .from("shops")
      .update({ description, prices_public: pricesPublic })
      .eq("id", shop.id);

    setSavingShop(false);

    if (error) {
      setShopMessage({ type: "error", text: error.message });
      return;
    }
    setShopMessage({ type: "success", text: "Saved." });
    onShopUpdated();
  }

  async function handleBankSave(e) {
    e.preventDefault();
    setSavingBank(true);
    setBankMessage(null);
    setBankError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("payout_accounts").upsert(
      {
        user_id: user.id,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
      },
      { onConflict: "user_id" }
    );

    setSavingBank(false);

    if (error) {
      setBankError(error.message ?? "Could not save bank details.");
      return;
    }
    setBankMessage("Bank details saved.");
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Shop details</h2>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <form onSubmit={handleShopSave}>
          <div className="field">
            <label htmlFor="settingsDescription">Description</label>
            <textarea
              id="settingsDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="pricesPublic"
              type="checkbox"
              checked={pricesPublic}
              onChange={(e) => setPricesPublic(e.target.checked)}
              style={{ width: "auto" }}
            />
            <label htmlFor="pricesPublic" style={{ margin: 0 }}>
              Show my prices to customers browsing my shop page
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingShop}>
            {savingShop ? "Saving…" : "Save shop details"}
          </button>

          {shopMessage && (
            <p className={shopMessage.type === "error" ? "error-text" : "success-text"}>
              {shopMessage.text}
            </p>
          )}
        </form>
      </div>

      <div className="section-header">
        <h2 className="section-title">Payout account</h2>
      </div>

      <div className="card">
        <p className="card-sub" style={{ marginBottom: 16 }}>
          This is where your 90% share is sent after each ticket is
          released from escrow.
        </p>

        {loadingAccount ? (
          <p style={{ color: "var(--parchment-200)", opacity: 0.6 }}>Loading…</p>
        ) : (
          <form onSubmit={handleBankSave}>
            <div className="field">
              <label htmlFor="bank">Bank</label>
              <select id="bank" value={bankCode} onChange={(e) => setBankCode(e.target.value)} required>
                <option value="">Select your bank</option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="accountNumber">Account number</label>
              <input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                maxLength={10}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="accountName">Account name</label>
              <input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="As it appears on your bank account"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingBank}>
              {savingBank ? "Saving…" : "Save payout account"}
            </button>

            {bankError && <p className="error-text">{bankError}</p>}
            {bankMessage && <p className="success-text">{bankMessage}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
