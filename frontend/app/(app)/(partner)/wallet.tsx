import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../../../constants/Colors';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '@aptifyx/shared-types';

export default function PartnerWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions')
      ]);
      setBalance(Number(walletRes.data.data.balance));
      setTransactions(txRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isCredit = ['SIGNUP_BONUS', 'CREDIT'].includes(item.type);
    
    return (
      <Card style={styles.txCard}>
        <View style={styles.txIcon}>
          <MaterialCommunityIcons 
            name={isCredit ? 'arrow-down-bold' : 'arrow-up-bold'} 
            size={24} 
            color={isCredit ? Colors.status.success : Colors.status.danger} 
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txType}>{item.type.replace('_', ' ')}</Text>
          <Text style={styles.txDesc}>{item.description}</Text>
          <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.txAmount, { color: isCredit ? Colors.status.success : Colors.light.text }]}>
          {isCredit ? '+' : '-'}{item.amount}
        </Text>
      </Card>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.partner.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        
        <Card style={styles.balanceCard} elevated>
          <Text style={styles.balanceLabel}>Available to Withdraw</Text>
          <Text style={styles.balanceValue}>{balance.toFixed(2)} <Text style={styles.currency}>AFX</Text></Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Recent Payouts</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.txList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.partner.primary,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.partner.primaryDark,
    marginVertical: 8,
  },
  currency: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  txList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  txDesc: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  txDate: {
    fontSize: 10,
    color: Colors.light.border,
    marginTop: 4,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
