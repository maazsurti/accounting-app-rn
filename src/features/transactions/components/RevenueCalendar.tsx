import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PressScale } from '@/components/PressScale';
import { useTheme } from '@/core/theme';
import { formatInr } from '@/core/utils/format';

interface RevenueCalendarProps {
  displayMonth: Date;
  selectedDate: Date;
  revenueByDate: Map<string, number>;
  onMonthChanged: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function revenueLabel(amount: number): string {
  if (amount <= 0) return '';
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${formatInr(amount)}`;
}

export function RevenueCalendar({
  displayMonth,
  selectedDate,
  revenueByDate,
  onMonthChanged,
  onSelectDate
}: RevenueCalendarProps) {
  const { colors, text } = useTheme();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const isCurrentOrFutureMonth =
    displayMonth.getFullYear() > now.getFullYear() ||
    (displayMonth.getFullYear() === now.getFullYear() &&
      displayMonth.getMonth() >= now.getMonth());

  function prevMonth() {
    const d = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1);
    onMonthChanged(d);
  }

  function nextMonth() {
    if (isCurrentOrFutureMonth) return;
    const d = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);
    onMonthChanged(d);
  }

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset: getDay() returns 0=Sun, so map to 0=Mon
  const rawOffset = firstDay.getDay();
  const offset = rawOffset === 0 ? 6 : rawOffset - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to 42 cells (6 rows × 7 cols)
  while (cells.length < 42) cells.push(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={prevMonth} accessibilityLabel="Previous month">
          <MaterialIcons name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={text.labelMedium}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          disabled={isCurrentOrFutureMonth}
          accessibilityLabel="Next month"
        >
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isCurrentOrFutureMonth ? colors.textDisabled : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.cell}>
            <Text style={[text.labelSmall, { color: colors.textSecondary, textAlign: 'center' }]}>
              {d}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`empty-${idx}`} style={styles.cell} />;
          const date = new Date(year, month, day);
          const isSelected = toDateKey(date) === toDateKey(selected);
          const isToday = toDateKey(date) === toDateKey(today);
          const isFuture = date > today;
          const revenue = revenueByDate.get(toDateKey(date)) ?? 0;
          const label = isFuture ? '' : revenueLabel(revenue);

          return (
            <View key={day} style={styles.cell}>
              <PressScale
                onPress={isFuture ? undefined : () => onSelectDate(date)}
                scale={0.9}
                accessibilityRole={isFuture ? undefined : 'button'}
                accessibilityLabel={`${day} ${MONTH_NAMES[month]}${revenue > 0 ? `, ₹${formatInr(revenue)}` : ''}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.cellInner}>
                  <View
                    style={[
                      styles.circle,
                      isSelected && { backgroundColor: colors.primary },
                      isToday && !isSelected && {
                        borderWidth: 1.5,
                        borderColor: colors.primary
                      }
                    ]}
                  >
                    <Text
                      style={[
                        text.labelSmall,
                        {
                          color: isSelected
                            ? colors.onPrimary
                            : isFuture
                              ? colors.textDisabled
                              : colors.textPrimary,
                          fontWeight: isToday || isSelected ? '700' : undefined,
                          textAlign: 'center'
                        }
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {label.length > 0 && (
                    <Text
                      style={[
                        text.labelSmall,
                        {
                          color: colors.primary,
                          fontSize: 10,
                          textAlign: 'center'
                        }
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  )}
                </View>
              </PressScale>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 16
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center'
  },
  cellInner: {
    alignItems: 'center',
    paddingVertical: 2
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
