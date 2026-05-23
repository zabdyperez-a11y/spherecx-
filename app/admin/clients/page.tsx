export default function ClientManagementPage() {
  const clients = [
    { name: "Visionary Eye", status: "Active", users: 8 },
    { name: "Southwest Eye Institute", status: "Active", users: 12 },
    { name: "Demo Client", status: "Pending Setup", users: 1 },
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-8">
        <p className="text-sm text-blue-400">Super Admin</p>
        <h1 className="text-3xl font-semibold">Client Management</h1>
        <p className="text-slate-400 mt-2">
          Add clients, manage access, force password resets, deactivate accounts, or permanently delete client data.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-slate-400 text-sm">Total Clients</p>
          <p className="text-3xl mt-2">3</p>
        </div>
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-slate-400 text-sm">Active Clients</p>
          <p className="text-3xl mt-2">2</p>
        </div>
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-slate-400 text-sm">Pending Setup</p>
          <p className="text-3xl mt-2">1</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Client</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Client company name" />
          <input className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Client admin name" />
          <input className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Client admin email" />
          <input className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Temporary password" />
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-slate-300">
          <input type="checkbox" defaultChecked />
          Force client to change password on first login
        </label>

        <button className="mt-5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3">
          Create Client
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Clients</h2>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Status</th>
              <th className="p-4">Users</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.name} className="border-t border-slate-800">
                <td className="p-4">{client.name}</td>
                <td className="p-4">
                  <span className="rounded-full bg-blue-500/10 text-blue-400 px-3 py-1 text-sm">
                    {client.status}
                  </span>
                </td>
                <td className="p-4">{client.users}</td>
                <td className="p-4 flex gap-2">
                  <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm">Edit</button>
                  <button className="rounded-lg bg-yellow-500/10 text-yellow-400 px-3 py-2 text-sm">
                    Deactivate
                  </button>
                  <button className="rounded-lg bg-red-500/10 text-red-400 px-3 py-2 text-sm">
                    Delete Permanently
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
