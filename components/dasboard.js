import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [balance, setBalance] = useState(user?.balance || 0)
  const [transactions, setTransactions] = useState([])
  const [transferData, setTransferData] = useState({
    bank: '',
    accountNumber: '',
    amount: '',
    note: ''
  })
  const [qrisAmount, setQrisAmount] = useState('')
  const [qrisCode, setQrisCode] = useState('')
  const [showQRIS, setShowQRIS] = useState(false)
  const [scanResult, setScanResult] = useState('')

  // Daftar bank yang tersedia
  const banks = [
    'BCA', 'BNI', 'BRI', 'Mandiri', 'BTN', 
    'CIMB Niaga', 'Danamon', 'Permata', 'Maybank',
    'Bank Mega', 'Bank Sinarmas', 'Bank DBS', 'Bank UOB'
  ]

  useEffect(() => {
    // Load transactions from localStorage
    const savedTransactions = localStorage.getItem('transactions')
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions))
    }

    // Load balance
    const savedBalance = localStorage.getItem(`balance_${user?.id}`)
    if (savedBalance) {
      setBalance(parseFloat(savedBalance))
    }
  }, [user])

  const handleTransfer = async (e) => {
    e.preventDefault()
    
    if (parseFloat(transferData.amount) > balance) {
      alert('Saldo tidak mencukupi!')
      return
    }

    const newTransaction = {
      id: uuidv4(),
      type: 'transfer',
      amount: -parseFloat(transferData.amount),
      bank: transferData.bank,
      accountNumber: transferData.accountNumber,
      note: transferData.note,
      date: new Date().toISOString(),
      status: 'completed'
    }

    const updatedTransactions = [newTransaction, ...transactions]
    setTransactions(updatedTransactions)
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions))

    const newBalance = balance - parseFloat(transferData.amount)
    setBalance(newBalance)
    localStorage.setItem(`balance_${user.id}`, newBalance.toString())

    alert('Transfer berhasil!')
    setTransferData({
      bank: '',
      accountNumber: '',
      amount: '',
      note: ''
    })
  }

  const generateQRIS = async () => {
    if (!qrisAmount || parseFloat(qrisAmount) <= 0) {
      alert('Masukkan jumlah yang valid!')
      return
    }

    // Generate QRIS data (simulasi)
    const qrisData = {
      id: uuidv4(),
      merchant: 'Payment Gateway',
      amount: parseFloat(qrisAmount),
      timestamp: new Date().toISOString(),
      reference: uuidv4()
    }

    try {
      const qrCodeData = JSON.stringify(qrisData)
      const qrCode = await QRCode.toDataURL(qrCodeData)
      setQrisCode(qrCode)
      setShowQRIS(true)
    } catch (err) {
      alert('Gagal generate QRIS')
    }
  }

  const handleScanQRIS = async () => {
    // Simulasi scan QRIS
    if (!scanResult) {
      alert('Silakan scan QRIS terlebih dahulu')
      return
    }

    try {
      const qrisData = JSON.parse(scanResult)
      
      // Proses pembayaran
      const newTransaction = {
        id: uuidv4(),
        type: 'receive',
        amount: qrisData.amount,
        reference: qrisData.reference,
        date: new Date().toISOString(),
        status: 'completed',
        note: 'Pembayaran QRIS'
      }

      const updatedTransactions = [newTransaction, ...transactions]
      setTransactions(updatedTransactions)
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions))

      const newBalance = balance + qrisData.amount
      setBalance(newBalance)
      localStorage.setItem(`balance_${user.id}`, newBalance.toString())

      alert(`Pembayaran berhasil! +Rp${qrisData.amount.toLocaleString()}`)
      setScanResult('')
      setShowQRIS(false)
    } catch (err) {
      alert('QRIS tidak valid!')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Payment Gateway</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Halo, {user?.name}</span>
            <button
              onClick={onLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-600">Total Saldo</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(balance)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total Transaksi</p>
              <p className="text-3xl font-bold text-green-600">{transactions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Status</p>
              <p className="text-3xl font-bold text-green-600">Aktif</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 rounded ${activeTab === 'transfer' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveTab('transfer')}
            >
              Transfer
            </button>
            <button
              className={`px-4 py-2 rounded ${activeTab === 'qris' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveTab('qris')}
            >
              QRIS
            </button>
            <button
              className={`px-4 py-2 rounded ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            <button
              className={`px-4 py-2 rounded ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Saldo Anda</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">QRIS Terakhir</h3>
                  {transactions.filter(t => t.type === 'receive').length > 0 ? (
                    <p>QRIS Active</p>
                  ) : (
                    <p className="text-gray-500">Belum ada QRIS</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Transfer ke Semua Bank</h2>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pilih Bank</label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={transferData.bank}
                    onChange={(e) => setTransferData({...transferData, bank: e.target.value})}
                  >
                    <option value="">Pilih Bank</option>
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Rekening</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={transferData.accountNumber}
                    onChange={(e) => setTransferData({...transferData, accountNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={transferData.note}
                    onChange={(e) => setTransferData({...transferData, note: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Transfer Sekarang
                </button>
              </form>
            </div>
          )}

          {activeTab === 'qris' && (
            <div>
              <h2 className="text-xl font-bold mb-4">QRIS Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Buat QRIS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={qrisAmount}
                        onChange={(e) => setQrisAmount(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={generateQRIS}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Generate QRIS
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Scan QRIS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hasil Scan QRIS</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Tempel hasil scan QRIS di sini"
                        value={scanResult}
                        onChange={(e) => setScanResult(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleScanQRIS}
                      className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Scan & Bayar
                    </button>
                  </div>
                </div>
              </div>

              {showQRIS && qrisCode && (
                <div className="mt-6 text-center">
                  <h3 className="font-semibold mb-2">QRIS Code</h3>
                  <img src={qrisCode} alt="QRIS" className="mx-auto max-w-[200px]" />
                  <p className="mt-2 text-sm text-gray-600">
                    Jumlah: {formatCurrency(parseFloat(qrisAmount))}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-bold mb-4">History Transaksi</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500">Belum ada transaksi</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-4 border rounded ${
                        transaction.type === 'transfer' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
                            {transaction.type === 'transfer' ? 'Transfer Keluar' : 'Penerimaan'}
                          </p>
                          {transaction.type === 'transfer' ? (
                            <>
                              <p className="text-sm text-gray-600">Bank: {transaction.bank}</p>
                              <p className="text-sm text-gray-600">No. Rekening: {transaction.accountNumber}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">Pembayaran QRIS</p>
                          )}
                          {transaction.note && (
                            <p className="text-sm text-gray-600">Catatan: {transaction.note}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.type === 'transfer' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.type === 'transfer' ? '-' : '+'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className={`text-sm ${transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {transaction.status === 'completed' ? 'Selesai' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <p className="text-gray-600">{user?.phone}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ID Pengguna</p>
                      <p className="font-mono text-sm">{user?.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bergabung Sejak</p>
                      <p className="text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}