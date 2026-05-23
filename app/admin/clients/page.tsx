"use client"

import { useEffect, useState } from "react"

type Client = {
  id: string
  name: string
  adminName: string
  adminEmail: string
  status: "Active" | "Inactive" | "Pending Setup"
  users: number
  mustChangePassword: boolean
}

export default function ClientManagementPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [name, setName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [tempPassword, setTempPassword] = useState("")
  const [mustChangePassword, setMustChangePassword] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("spherecx_clients")

    if (saved) {
      setClients(JSON.parse(saved))
    } else {
      const starterClients: Client[] = [
        {
          id: "1",
          name: "Visionary Eye",
          adminName: "Client Admin",
          adminEmail: "admin@visionaryeye.com",
          status: "Active",
          users: 8,
          mustChangePassword: false,
        },
        {
          id: "2",
          name: "Southwest Eye Institute",
          adminName: "Client Admin",
          adminEmail: "admin@southwesteye.com",
          status: "Active",
          users: 12,
          mustChangePassword: false,
        },
      ]

      setClients(starterClients)
      localStorage.setItem("spherecx_clients", JSON.stringify(starterClients))
    }
  }, [])

  function saveClients(updatedClients: Client[]) {
    setClients(updatedClients)
    localStorage.setItem("spherecx_clients", JSON.stringify(updatedClients))
  }

  function createClient() {
    if (!name || !adminName || !adminEmail || !tempPassword) {
      alert("Please complete all fields before creating the client.")
      return
    }

    const newClient: Client = {
      id: crypto.randomUUID(),
      name,
      adminName,
      adminEmail,
      status: "Pending Setup",
      users: 1,
      mustChangePassword,
    }

    saveClients([...clients, newClient])

    setName("")
    setAdminName("")
    setAdminEmail("")
    setTempPassword("")
    setMustChangePassword(true)

    alert("Client created. Temporary password added for setup.")
  }

  function deactivateClient(id: string) {
    const updated = clients.map((client) =>
      client.id === id ? { ...client, status: "Inactive" as const } : client
    )

    saveClients(updated)
  }

  function reactivateClient(id: string) {
    const updated = clients.map((client) =>
      client.id === id ? { ...client, status: "Active" as const } : client
    )

    saveClients(updated)
  }

  function forcePasswordReset(id: string) {
    const updated = clients.map((client) =>
      client.id === id ? { ...client, mustChangePassword: true } : client
    )

    saveClients(updated)
    alert("Password reset required on next login.")
  }

  function deleteClient(id: string, clientName: string) {
    const confirmation = prompt(
      `This will permanently delete ${clientName}. Type DELETE CLIENT to confirm.`
    )

    if (confirmation !== "DELETE CLIENT") {
      alert("Delete cancelled.")
      return
    }

    const updated = clients.filter((client) => client.id !== id)
    saveClients(updated)

    alert("Client permanently deleted.")
  }

  const activeClients = clients.filter((client) => client.status === "Active").length
  const pendingClients = clients.filter((client) => client.status === "Pending Setup").length

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-8">
        <p className="text-sm text-blue-400">Super Admin</p>
        <h1 className="text-3xl font-semibold">Client Management</h1>
        <p className="text-slate-400 mt-2">
          Add clients, manage client admins, require password resets, deactivate clients, or permanently delete client records.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-slate-400 text-sm">Total Clients</p>
          <p className="text-3xl mt-2">{clients.length}</p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-slate-400 text-sm">Active Clients</p>
          <p className="text-3xl mt-2">{activeClients}</p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-slate-400 text-sm">Pending Setup</p>
          <p className="text-3xl mt-2">{pendingClients}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Client</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Client company name" />
          <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Client admin name" />
          <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Client admin email" />
          <input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3" placeholder="Temporary password" />
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-slate-300">
          <input type="checkbox" checked={mustChangePassword} onChange={(e) => setMustChangePassword(e.target.checked)} />
          Force client to change password on first login
        </label>

        <button onClick={createClient} className="mt-5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3">
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
              <th className="p-4">Admin</th>
              <th className="p-4">Status</th>
              <th className="p-4">Users</th>
              <th className="p-4">Password Reset</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-slate-800">
                <td className="p-4">{client.name}</td>
                <td className="p-4">
                  <p>{client.adminName}</p>
                  <p className="text-sm text-slate-400">{client.adminEmail}</p>
                </td>
                <td className="p-4">
                  <span className="rounded-full bg-blue-500/10 text-blue-400 px-3 py-1 text-sm">
                    {client.status}
                  </span>
                </td>
                <td className="p-4">{client.users}</td>
                <td className="p-4">
                  {client.mustChangePassword ? "Required" : "Not Required"}
                </td>
                <td className="p-4 flex flex-wrap gap-2">
                  <button onClick={() => forcePasswordReset(client.id)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">
                    Force Reset
                  </button>

                  {client.status === "Inactive" ? (
                    <button onClick={() => reactivateClient(client.id)} className="rounded-lg bg-green-500/10 text-green-400 px-3 py-2 text-sm">
                      Reactivate
                    </button>
                  ) : (
                    <button onClick={() => deactivateClient(client.id)} className="rounded-lg bg-yellow-500/10 text-yellow-400 px-3 py-2 text-sm">
                      Deactivate
                    </button>
                  )}

                  <button onClick={() => deleteClient(client.id, client.name)} className="rounded-lg bg-red-500/10 text-red-400 px-3 py-2 text-sm">
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
