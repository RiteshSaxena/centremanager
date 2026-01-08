<script setup lang="ts">
import { computed } from 'vue';
import Spinner from './Spinner.vue';

export interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hideOnMobile?: boolean;
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    data: any[];
    loading?: boolean;
    emptyText?: string;
    striped?: boolean;
    hoverable?: boolean;
    headerClass?: string;
  }>(),
  {
    loading: false,
    emptyText: 'No data available',
    striped: false,
    hoverable: true,
    headerClass: 'bg-primary-500 text-white'
  }
);

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

const isEmpty = computed(() => !props.loading && props.data.length === 0);
</script>

<template>
  <div class="w-full overflow-hidden rounded-2xl border border-secondary-100 bg-white shadow-card">
    <!-- Desktop Table -->
    <div class="hidden md:block overflow-x-auto">
      <table class="w-full">
        <thead :class="headerClass">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3 text-sm font-semibold',
                alignClasses[col.align || 'left'],
                col.width ? `w-[${col.width}]` : ''
              ]"
            >
              {{ col.header }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-secondary-100">
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-4 py-12 text-center">
              <Spinner size="lg" />
            </td>
          </tr>
          <tr v-else-if="isEmpty">
            <td :colspan="columns.length" class="px-4 py-12 text-center text-secondary-400">
              {{ emptyText }}
            </td>
          </tr>
          <tr
            v-for="(row, index) in data"
            v-else
            :key="index"
            :class="[
              'transition-colors',
              hoverable ? 'hover:bg-secondary-50' : '',
              striped && index % 2 === 1 ? 'bg-secondary-50/50' : ''
            ]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="['px-4 py-3 text-sm text-secondary-700', alignClasses[col.align || 'left']]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden">
      <div v-if="loading" class="p-8 text-center">
        <Spinner size="lg" />
      </div>
      <div v-else-if="isEmpty" class="p-8 text-center text-secondary-400">
        {{ emptyText }}
      </div>
      <div v-else class="divide-y divide-secondary-100">
        <div
          v-for="(row, index) in data"
          :key="index"
          class="p-4 hover:bg-secondary-50 transition-colors"
        >
          <slot name="mobile-card" :row="row" :index="index">
            <div class="space-y-2">
              <div
                v-for="col in columns.filter((c) => !c.hideOnMobile)"
                :key="col.key"
                class="flex justify-between items-start gap-4"
              >
                <span class="text-xs font-medium text-secondary-400 uppercase tracking-wide">
                  {{ col.header }}
                </span>
                <span class="text-sm text-secondary-700 text-right">
                  <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                    {{ row[col.key] || '-' }}
                  </slot>
                </span>
              </div>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- Footer slot for pagination etc -->
    <div v-if="$slots.footer" class="border-t border-secondary-100">
      <div class="px-4 py-3 bg-secondary-50/50">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
