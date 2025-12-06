/**
 * Page de Gestion des Clés API Coinbase
 */

import { useState } from 'react';

interface ApiKey {
  id: string;
  nickname: string;
  apiKeyId: string;
  isActive: boolean;
  isValid: boolean;
  createdAt: string;
  lastUsed: string | null;
}

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      nickname: 'Compte Principal',
      apiKeyId: 'organizations/.../apiKeys/6a754a91-...',
      isActive: true,
      isValid: true,
      createdAt: '2025-12-01',
      lastUsed: '2025-12-05',
    },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState({
    nickname: '',
    apiKeyId: '',
    apiSecret: '',
  });
  
  const handleAddKey = async () => {
    // TODO: Appeler l'API pour ajouter la clé
    console.log('Adding key:', newKey);
    setShowAddModal(false);
    setNewKey({ nickname: '', apiKeyId: '', apiSecret: '' });
  };
  
  const handleDeleteKey = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) {
      setApiKeys(prev => prev.filter(k => k.id !== id));
    }
  };
  
  const handleToggleActive = async (id: string) => {
    setApiKeys(prev => prev.map(k => 
      k.id === id ? { ...k, isActive: !k.isActive } : k
    ));
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔑 Clés API Coinbase
              </h1>
              <p className="text-gray-600">
                Gérez vos clés API pour le trading automatisé
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Ajouter une Clé
            </button>
          </div>
        </div>
        
        {/* Info Security */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Sécurité</h3>
              <p className="text-sm text-blue-700">
                Vos clés API sont chiffrées avec AES-256-GCM et stockées en toute sécurité.
                Elles ne sont jamais affichées en clair après leur ajout.
              </p>
            </div>
          </div>
        </div>
        
        {/* Liste des Clés */}
        <div className="space-y-4">
          {apiKeys.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <span className="text-6xl mb-4 block">🔑</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aucune clé API configurée
              </h3>
              <p className="text-gray-600 mb-6">
                Ajoutez votre première clé API Coinbase pour commencer le trading
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Ajouter une Clé API
              </button>
            </div>
          ) : (
            apiKeys.map((key) => (
              <div key={key.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{key.nickname}</h3>
                      {key.isValid ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          ✓ Valide
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          ✗ Invalide
                        </span>
                      )}
                      {key.isActive ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">ID:</span> {key.apiKeyId}
                      </p>
                      <p>
                        <span className="font-medium">Créée le:</span> {new Date(key.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {key.lastUsed && (
                        <p>
                          <span className="font-medium">Dernière utilisation:</span> {new Date(key.lastUsed).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(key.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        key.isActive
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {key.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Modal Ajout de Clé */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ajouter une Clé API Coinbase
              </h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la Clé (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newKey.nickname}
                    onChange={(e) => setNewKey({ ...newKey, nickname: e.target.value })}
                    placeholder="Ex: Compte Principal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key ID *
                  </label>
                  <input
                    type="text"
                    value={newKey.apiKeyId}
                    onChange={(e) => setNewKey({ ...newKey, apiKeyId: e.target.value })}
                    placeholder="organizations/.../apiKeys/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Secret (Private Key) *
                  </label>
                  <textarea
                    value={newKey.apiSecret}
                    onChange={(e) => setNewKey({ ...newKey, apiSecret: e.target.value })}
                    placeholder="-----BEGIN EC PRIVATE KEY-----&#10;...&#10;-----END EC PRIVATE KEY-----"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Assurez-vous que votre clé API a les permissions de trading</li>
                      <li>Ne partagez jamais votre clé API avec qui que ce soit</li>
                      <li>La clé sera chiffrée et stockée en toute sécurité</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewKey({ nickname: '', apiKeyId: '', apiSecret: '' });
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                
                <button
                  onClick={handleAddKey}
                  disabled={!newKey.apiKeyId || !newKey.apiSecret}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter la Clé
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
