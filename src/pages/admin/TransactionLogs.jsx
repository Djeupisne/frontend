import React, { useState, useEffect } from 'react';
import transactionLogService from '../../services/transactionLogService';
import './TransactionLogs.css';

const TransactionLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let data;
      if (selectedUser) {
        data = await transactionLogService.getUserLogs(selectedUser, currentPage);
      } else {
        data = await transactionLogService.getAllLogs(currentPage);
      }
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await transactionLogService.getUserStatistics();
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleUserFilter = (username) => {
    setSelectedUser(username);
    setCurrentPage(0);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SUCCESS': return <span className="badge badge-success">✓ Succès</span>;
      case 'FAILED': return <span className="badge badge-danger">✗ Échec</span>;
      default: return <span className="badge badge-warning">⏳ En cours</span>;
    }
  };

  if (isLoading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div className="transaction-logs-container">
      <div className="page-header">
        <h1>📋 Journal des Transactions</h1>
        <p>Historique complet de toutes les transactions par utilisateur</p>
      </div>

      {/* Statistiques par utilisateur */}
      <div className="stats-section">
        <h3>📊 Statistiques par utilisateur</h3>
        <div className="stats-grid">
          {stats.map(stat => (
            <div
              key={stat.username}
              className={`stat-card ${selectedUser === stat.username ? 'active' : ''}`}
              onClick={() => handleUserFilter(stat.username)}
            >
              <div className="stat-username">👤 {stat.username}</div>
              <div className="stat-count">{stat.transactionCount} transactions</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="filter-bar">
        <button
          className={!selectedUser ? 'active' : ''}
          onClick={() => handleUserFilter('')}
        >
          Tous les utilisateurs
        </button>
        <button onClick={fetchData} className="refresh-btn">
          🔄 Rafraîchir
        </button>
      </div>

      {/* Tableau des logs */}
      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Frais</th>
              <th>Source</th>
              <th>Cible</th>
              <th>Statut</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">Aucune transaction trouvée</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className={log.status === 'FAILED' ? 'failed-row' : ''}>
                  <td className="date-cell">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="user-cell">
                    <strong>{log.username}</strong>
                  </td>
                  <td>{log.userRole?.includes('ADMIN') ? '👑 Admin' : '👤 User'}</td>
                  <td>
                    <span className="type-badge">{log.transactionType}</span>
                  </td>
                  <td className="amount-cell">
                    {log.amount?.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="fees-cell">
                    {log.feesAmount > 0 ? `${log.feesAmount.toLocaleString('fr-FR')} FCFA` : '-'}
                  </td>
                  <td>{log.sourcePhone || log.sourceAccount || '-'}</td>
                  <td>{log.targetPhone || log.targetAccount || '-'}</td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td className="ip-cell">
                    {log.ipAddress}
                    <small className="user-agent-preview" title={log.userAgent}>
                      {log.userAgent?.substring(0, 20)}...
                    </small>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ← Précédent
          </button>
          <span>Page {currentPage + 1} / {totalPages}</span>
          <button
            disabled={currentPage + 1 >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionLogs;