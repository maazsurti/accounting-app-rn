import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PressScale } from '@/components/PressScale';
import { useDeps } from '@/core/di/app-dependencies';
import { useL10n } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatInr } from '@/core/utils/format';
import type { TransactionListEntry } from '@/features/transactions/models/transaction-list-entry';
import { entrySortTime, entryRevenue } from '@/features/transactions/models/transaction-list-entry';
import { BatchCard } from '@/features/transactions/components/BatchCard';
import { EditTransactionSheet } from '@/features/transactions/components/EditTransactionSheet';
import { RevenueCalendar } from '@/features/transactions/components/RevenueCalendar';
import { TransactionTile } from '@/features/transactions/components/TransactionTile';
import type { Transaction } from '@/features/quick_record/models/transaction';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

type DateSection = { title: string; data: TransactionListEntry[] };

export default observer(function TransactionsScreen() {
  const deps = useDeps();
  const controller = deps.transactions;
  const router = useRouter();
  const l10n = useL10n();
  const { colors, text } = useTheme();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useLayoutEffect(() => {
    controller.load();
  }, [controller]);

  const filterDate = controller.filterDate;
  const calendarExpanded = controller.calendarExpanded;
  const selectionActive = controller.selectionActive;
  const selectedIds = controller.selectedTransactionIds;
  const expandedBatchIds = controller.expandedBatchIds;
  const state = controller.state;

  const filteredEntries = useMemo(() => {
    return controller.entries.filter((e) => isSameDay(entrySortTime(e), filterDate));
  }, [controller.entries, filterDate]);

  const headerRevenue = useMemo(
    () => filteredEntries.reduce((s, e) => s + entryRevenue(e), 0),
    [filteredEntries]
  );

  const saleCount = useMemo(
    () =>
      filteredEntries.reduce(
        (s, e) => s + (e.kind === 'single' ? 1 : e.transactions.length),
        0
      ),
    [filteredEntries]
  );

  const revenueByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of controller.transactions) {
      const key = toDateKey(tx.soldAt);
      map.set(key, (map.get(key) ?? 0) + tx.revenue);
    }
    return map;
  }, [controller.transactions]);

  const sections: DateSection[] = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const groups = new Map<string, { label: string; items: TransactionListEntry[] }>();

    for (const entry of filteredEntries) {
      const st = entrySortTime(entry);
      const day = new Date(st.getFullYear(), st.getMonth(), st.getDate());
      const dayKey = toDateKey(day);
      if (!groups.has(dayKey)) {
        const label = isSameDay(day, today)
          ? l10n('today')
          : isSameDay(day, yesterday)
            ? l10n('yesterday')
            : formatDate(day);
        groups.set(dayKey, { label, items: [] });
      }
      groups.get(dayKey)!.items.push(entry);
    }

    return Array.from(groups.values()).map((g) => ({ title: g.label, data: g.items }));
  }, [filteredEntries, l10n]);

  async function confirmDeleteSelected() {
    const txList = controller.transactions.filter(
      (tx) => tx.id !== null && selectedIds.has(tx.id)
    );
    if (txList.length === 0) return;
    const count = txList.length;

    Alert.alert(
      l10n('deleteSelectedSalesTitle'),
      l10n('deleteSelectedSalesBody', { count }),
      [
        { text: l10n('cancel'), style: 'cancel' },
        {
          text: l10n('delete'),
          style: 'destructive',
          onPress: async () => {
            const ids = new Set(txList.map((t) => t.id).filter((id): id is number => id !== null));
            setDeletingIds(ids);
            await new Promise((r) => setTimeout(r, 200));
            try {
              controller.deleteTransactions(txList);
            } catch {
              Alert.alert('', l10n('genericError'));
            } finally {
              setDeletingIds(new Set());
            }
          }
        }
      ]
    );
  }

  const renderItem = useCallback(
    ({ item }: { item: TransactionListEntry }) => {
      if (item.kind === 'single') {
        const tx = item.tx;
        const isDeleting = tx.id !== null && deletingIds.has(tx.id);
        return (
          <View style={styles.itemPadding}>
            <TransactionTile
              transaction={tx}
              selected={tx.id !== null && selectedIds.has(tx.id)}
              selectionActive={selectionActive}
              isDeleting={isDeleting}
              onTap={() => {
                if (selectionActive) {
                  controller.toggleSelection(tx);
                } else {
                  setEditingTx(tx);
                }
              }}
              onLongPress={() => controller.toggleSelection(tx)}
            />
          </View>
        );
      }
      return (
        <View style={styles.itemPadding}>
          <BatchCard
            entry={item}
            isExpanded={expandedBatchIds.has(item.batchId)}
            selected={item.transactions.every((t) => t.id !== null && selectedIds.has(t.id))}
            partiallySelected={item.transactions.some((t) => t.id !== null && selectedIds.has(t.id))}
            selectionActive={selectionActive}
            onToggleExpand={() => controller.toggleBatchExpanded(item.batchId)}
            onToggleSelect={() => controller.toggleBatchSelection(item)}
            onItemTap={(tx) => {
              if (selectionActive) {
                controller.toggleSelection(tx);
              } else {
                setEditingTx(tx);
              }
            }}
          />
        </View>
      );
    },
    [controller, deletingIds, expandedBatchIds, selectedIds, selectionActive]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: DateSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={text.headlineSmall}>{section.title}</Text>
      </View>
    ),
    [text]
  );

  const isToday = isSameDay(filterDate, new Date());
  const dateLabel = isToday
    ? l10n('today')
    : `${filterDate.getDate()} ${MONTHS[filterDate.getMonth()]} ${filterDate.getFullYear()}`;

  const listHeader = (
    <View>
      {/* Stats header */}
      <View style={[styles.headerBox, { backgroundColor: colors.surface }]}>
        <View style={styles.headerRow}>
          <View style={styles.revenueCol}>
            <View style={styles.row}>
              <MaterialIcons name="trending-up" size={16} color={colors.primary} style={styles.mr5} />
              <Text style={[text.numericLarge, { color: colors.primary }]}>
                ₹{formatInr(headerRevenue)}
              </Text>
            </View>
            <View style={styles.row}>
              <MaterialIcons name="receipt" size={14} color={colors.textSecondary} style={styles.mr5} />
              <Text style={text.labelSmall}>{l10n('salesCountToday', { count: saleCount })}</Text>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              onPress={() => router.push('/transactions/analytics')}
              style={[styles.outlineBtn, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={l10n('analyticsTitle')}
            >
              <MaterialIcons name="bar-chart" size={16} color={colors.textSecondary} style={styles.mr6} />
              <Text style={[text.labelSmall, { color: colors.textSecondary }]}>
                {l10n('analyticsTitle')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Date chip */}
        <PressScale
          onPress={() => { controller.calendarExpanded = !controller.calendarExpanded; }}
          accessibilityRole="button"
          accessibilityLabel={dateLabel}
          accessibilityState={{ expanded: calendarExpanded }}
        >
          <View style={[styles.dateChip, { borderColor: colors.primary }]}>
            <MaterialIcons name="calendar-today" size={14} color={colors.primary} style={styles.mr6} />
            <Text style={[text.labelSmall, { color: colors.primary }]}>{dateLabel}</Text>
            <MaterialIcons
              name={calendarExpanded ? 'expand-less' : 'expand-more'}
              size={16}
              color={colors.primary}
              style={styles.ml6}
            />
          </View>
        </PressScale>
      </View>
      {/* Calendar */}
      {calendarExpanded && (
        <RevenueCalendar
          displayMonth={controller.displayMonth}
          selectedDate={filterDate}
          revenueByDate={revenueByDate}
          onMonthChanged={(month) => { controller.displayMonth = month; }}
          onSelectDate={(date) => {
            controller.filterDate = date;
            controller.displayMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            controller.calendarExpanded = false;
          }}
        />
      )}
      {/* Selection bar */}
      {selectionActive && (
        <View style={[styles.selectionBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={() => controller.clearSelection()}
            accessibilityRole="button"
            accessibilityLabel={l10n('cancel')}
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[text.labelMedium, styles.selectionLabel]}>
            {l10n('selectedSalesCount', { count: controller.selectedCount })}
          </Text>
          <TouchableOpacity
            onPress={confirmDeleteSelected}
            style={[styles.deleteOutlineBtn, { borderColor: colors.danger }]}
            accessibilityRole="button"
            accessibilityLabel={l10n('deleteSelected')}
          >
            <MaterialIcons name="delete-outline" size={16} color={colors.danger} style={styles.mr6} />
            <Text style={[text.labelSmall, { color: colors.danger }]}>{l10n('deleteSelected')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const isEmpty = state.kind !== 'loading' && filteredEntries.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {isEmpty ? (
        <>
          {listHeader}
          <View style={styles.emptyState}>
            <Text style={text.bodyMedium}>{l10n('noTransactionsYet')}</Text>
          </View>
        </>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, idx) =>
            item.kind === 'single'
              ? String(item.tx.id ?? idx)
              : `batch-${item.batchId}`
          }
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={listHeader}
          ListFooterComponent={<View style={styles.footer} />}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
      <EditTransactionSheet
        transaction={editingTx}
        controller={controller}
        onDismiss={() => setEditingTx(null)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerBox: {
    padding: 16,
    gap: 12
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  revenueCol: { gap: 4 },
  headerBtns: {
    flexDirection: 'row',
    gap: 8
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12
  },
  selectionLabel: { flex: 1 },
  deleteOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8
  },
  itemPadding: {
    paddingHorizontal: 16
  },
  listContent: { paddingBottom: 0 },
  footer: { height: 24 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  mr5: { marginRight: 5 },
  mr6: { marginRight: 6 },
  ml6: { marginLeft: 6 }
});
