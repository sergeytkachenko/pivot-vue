<template>
    <div class="md-layout md-alignment-center">
        <div class="md-layout-item md-size-75">
            <h3>count records: {{allRecords}}, loaded: {{loadedMBytes}}MB</h3>
            <h3>load time: {{loadingTime}}s, agg time: {{aggTime}}ms</h3>
            <vue-virtual-table :itemHeight="55"
                               :height="500"
                               :config="tableConfig"
                               :data="tableData"> </vue-virtual-table>
        </div>
    </div>

</template>

<script>
    import VueVirtualTable from 'vue-virtual-table'
    import perspective from '@finos/perspective';

    export default {
        name: 'Pivot',
        components: {
            VueVirtualTable
        },
        data: () => ({
            aggTime: 0,
            loadingTime: 0,
            count: 0,
            loaded: 0,
            loadedBytes: 0,
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

            loadedMBytes: function() {
                return Math.round(this.loadedBytes / 1024 / 1024);
            }
        },
        methods: {
            transform(str) {
                let data = str.split('[');
                this.startLoadingAggTime = new Date();
                data
                    .filter(x => x)
                    .forEach(d => {
                        const batch = JSON.parse('[' + d);
                        this.loaded += batch.length;
                        this.table.update(batch);
                    });
                this.calculateLoadingTime();
                this.calculateAggTime();
            },
            calculateLoadingTime() {
                this.endLoading = new Date();
                this.loadingTime = Math.round((this.endLoading - this.startLoading) / 1000);
            },
            calculateAggTime() {
                this.endLoading = new Date();
                this.aggTime = Math.round((this.endLoading - this.startLoadingAggTime));
            },
            async fetchDataStream() {
                this.startLoading = new Date();
                fetch('/api/data-stream')
                    .then(async response => {
                        const reader = response.body.getReader();
                        let receivedLength = 0;
                        let chunks = [];
                        // eslint-disable-next-line no-constant-condition
                        while(true) {
                            const {done, value} = await reader.read();
                            if (done) {
                                break;
                            }
                            chunks.push(value);
                            receivedLength += value.length;
                            this.loadedBytes = receivedLength;
                            this.calculateLoadingTime();
                        }
                        let chunksAll = new Uint8Array(receivedLength);
                        let position = 0;
                        for(let chunk of chunks) {
                            chunksAll.set(chunk, position);
                            position += chunk.length;
                        }
                        return new TextDecoder("utf-8").decode(chunksAll);
                    })
                    .then(async result => this.transform(result));
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
                this.calculateAggTime();
            });
            this.columns = ['__ROW_PATH__'].concat(await this.table.columns());
            this.rows = await view.to_json();
            this.fullLoad();
        }
    }
</script>
