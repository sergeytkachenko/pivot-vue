<template>
    <div class="md-layout md-alignment-center">
        <div class="md-layout-item md-size-75">
            <h3>all records: {{allRecords}}, loaded records: {{loadedRecords}}</h3>
            <vue-virtual-table :itemHeight="55"
                               :height="500"
                               :config="tableConfig"
                               :data="tableData"> </vue-virtual-table>
            <!--      <md-table v-model="rows" md-card>-->
            <!--        <md-table-toolbar>-->
            <!--          <h1 class="md-title">Pivot table example</h1>-->
            <!--        </md-table-toolbar>-->
            <!--        <md-table-row slot="md-table-row" slot-scope="{ item }">-->
            <!--          <md-table-cell md-label="__ROW_PATH__">-->
            <!--            {{ item['__ROW_PATH__'].join(' ') }}-->
            <!--          </md-table-cell>-->
            <!--          <md-table-cell-->
            <!--                  :md-label="column"-->
            <!--                  v-for="column in columns"-->
            <!--                  v-bind:key="column">-->
            <!--            {{ item[column] }}-->
            <!--          </md-table-cell>-->
            <!--        </md-table-row>-->
            <!--      </md-table>-->
        </div>
    </div>

</template>

<script>
    // import oboe from 'oboe'
    // import Parser from 'stream-json/Parser'
    import VueVirtualTable from 'vue-virtual-table'
    import perspective from '@finos/perspective';

    export default {
        name: 'Pivot',
        components: {
            VueVirtualTable
        },
        props: {
            msg: String
        },
        data: () => ({
            count: 0,
            loaded: 0,
            users: [
                {
                    id: 1,
                    name: 'Shawna Dubbin',
                    email: 'sdubbin0@geocities.com',
                    gender: 'Male',
                    title: 'Assistant Media Planner'
                },
                {
                    id: 2,
                    name: 'Odette Demageard',
                    email: 'odemageard1@spotify.com',
                    gender: 'Female',
                    title: 'Account Coordinator'
                },
                {
                    id: 3,
                    name: 'Lonnie Izkovitz',
                    email: 'lizkovitz3@youtu.be',
                    gender: 'Female',
                    title: 'Operator'
                },
                {
                    id: 4,
                    name: 'Thatcher Stave',
                    email: 'tstave4@reference.com',
                    gender: 'Male',
                    title: 'Software Test Engineer III'
                },
                {
                    id: 5,
                    name: 'Clarinda Marieton',
                    email: 'cmarietonh@theatlantic.com',
                    gender: 'Female',
                    title: 'Paralegal'
                }
            ],
            columns: [],
            rows: [],
            table: null,
            page: 0,
        }),
        computed: {
            tableConfig: function () {
                return this.columns.map(column => {
                    return { prop: column };
                });
            },
            tableData: function () {
                return this.rows.map(row => {
                    row['__ROW_PATH__'] = row['__ROW_PATH__'].join('->');
                    return row;
                });
            },
            allRecords: function () {
                return this.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
            loadedRecords: function () {
                return this.loaded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
        },
        methods: {
            transform(str) {
                let data = str.split('[');
                data
                    .filter(x => x)
                    .forEach(d => {
                        const batch = JSON.parse('[' + d);
                        this.loaded += batch.length;
                        this.table.update(batch);
                    });
            },
            async fetchDataStream() {
                fetch('/api/data-stream')
                    .then(async response => {
                        const result = await response.text();
                        this.transform(result);
                    });
            },
            async fetchSchema() {
                const response = await fetch(`/api/schema`);
                if (response.ok) {
                    try {
                        return await response.json();
                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    console.error(response.status);
                }
            },
            async fetchCount() {
                const response = await fetch(`/api/data-count`);
                if (response.ok) {
                    try {
                        return await response.text();
                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    console.error(response.status);
                }
            },

            async fullLoad() {
                this.count = await this.fetchCount();
                await this.fetchDataStream();
                //
                // for (let i = 0; i < 2; i++) {
                //     const data = await this.fetchData();
                //     data.forEach(line => {
                //         this.table.update([line]);
                //     });
                // }
            }
        },
        async created() {
            const worker = perspective.worker();
            this.table = worker.table(await this.fetchSchema());
            const view = this.table.view({
                row_pivot: ["Country"]
            });
            view.on_update(async () => {
                this.rows = await view.to_json();
            });
            this.columns = ['__ROW_PATH__'].concat(await this.table.columns());
            this.rows = await view.to_json();
            this.fullLoad();
        }
    }
</script>
<style scoped>
    .scroller {
        height: 100%;
    }

    .user {
        height: 32%;
        padding: 0 12px;
        display: flex;
        align-items: center;
    }
</style>
