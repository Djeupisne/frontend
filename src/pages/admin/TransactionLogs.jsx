import React, { useState, useEffect } from 'react';
import transactionLogService from '../../services/transactionLogService';
import './TransactionLogs.css';

const TransactionLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, success, failed
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, currentPage]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let data;
      if (selectedUser) {
        //  Filtrer par utilisateur sélectionné
        data = await transactionLogService.getUserLogs(selectedUser, currentPage);
      } else {
        //  Tous les utilisateurs
        data = await transactionLogService.getAllLogs(currentPage);
      }
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await transactionLogService.getUserStatistics();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleUserFilter = (username) => {
    setSelectedUser(username);
    setCurrentPage(0); // Reset à la première page
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SUCCESS': return <span className="badge badge-success">✓ Succès</span>;
      case 'FAILED': return <span className="badge badge-danger">✗ Échec</span>;
      default: return <span className="badge badge-warning">⏳ En cours</span>;
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch(type) {
      case 'VIREMENT_INTERNE': return 'Virement Interne';
      case 'DEBIT_MOBILE_MONEY': return 'Transfert Mobile Money';
      case 'CREDIT_MANUEL': return 'Crédit Manuel';
      case 'DEBIT_MANUEL': return 'Débit Manuel';
      case 'CREDIT': return 'Crédit';
      case 'DEBIT': return 'Débit';
      default: return type || 'N/A';
    }
  };

  // Filtrer les logs par statut
  const filteredLogs = logs.filter(log => {
    if (filter === 'success') return log.status === 'SUCCESS';
    if (filter === 'failed') return log.status === 'FAILED';
    return true;
  });

  // Calculer le nombre total de transactions
  const totalTransactions = stats.reduce((sum, s) => sum + (s.transactionCount || 0), 0);

  if (isLoading) {
    return (
      <div className="loading-spinner">
        Chargement des transactions...
      </div>
    );
  }

  return (
    <div className="transaction-logs-container">
      <div className="page-header">
        <h1>📋 Journal des Transactions</h1>
        <p>Historique complet de toutes les transactions par utilisateur</p>
      </div>

      {/* Statistiques par utilisateur */}
      <div className="stats-section">
        <h3>Statistiques par utilisateur</h3>
        <div className="stats-grid">
          <div
            className={`stat-card ${selectedUser === '' ? 'active' : ''}`}
            onClick={() => handleUserFilter('')}
          >
            <div className="stat-username">Tous</div>
            <div className="stat-count">{totalTransactions} transactions</div>
          </div>
          {stats.map(stat => (
            <div
              key={stat.username}
              className={`stat-card ${selectedUser === stat.username ? 'active' : ''}`}
              onClick={() => handleUserFilter(stat.username)}
            >
              <div className="stat-username">
                {stat.username === 'admin' ? '👑 ' : '👤 '}{stat.username}
              </div>
              <div className="stat-count">{stat.transactionCount} transactions</div>
            </div>
          ))}
        </div>
      </div>

      {/* Barre d'actions avec bouton Rafraîchir bien visible */}
      <div className="actions-bar">
        <div className="filter-section">
          <span className="filter-label">Filtrer par statut :</span>
          <div className="filter-buttons">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              Tous
            </button>
            <button className={filter === 'success' ? 'active' : ''} onClick={() => setFilter('success')}>
              ✓ Succès
            </button>
            <button className={filter === 'failed' ? 'active' : ''} onClick={() => setFilter('failed')}>
              ✗ Échecs
            </button>
          </div>
        </div>
        <button onClick={fetchLogs} className="refresh-btn">
          🔄 Rafraîchir
        </button>
      </div>

      {/* Tableau des logs */}
      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date & Heure</th>
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
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className={log.status === 'FAILED' ? 'failed-row' : ''}>
                  <td className="date-cell">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="user-cell">
                    <strong>{log.username}</strong>
                  </td>
                  <td>
                    {log.userRole?.includes('ADMIN') ? '👑 Administrateur' : '👤 Utilisateur'}
                  </td>
                  <td>
                    <span className="type-badge">
                      {getTransactionTypeLabel(log.transactionType)}
                    </span>
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
                      {log.userAgent?.substring(0, 30)}...
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

      <div className="table-footer">
        {selectedUser ? (
          <p>{filteredLogs.length} transaction(s) pour l'utilisateur <strong>{selectedUser}</strong></p>
        ) : (
          <p>{filteredLogs.length} transaction(s) affichée(s)</p>
        )}
      </div>
    </div>
  );
};

export default TransactionLogs;