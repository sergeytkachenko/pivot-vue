<template>
    <div class="md-layout md-alignment-center">
        <div class="md-layout-item md-size-75">
            <!--            <h3>count records: {{allRecords}}, loaded: {{loadedMBytes}}MB</h3>-->
            <!--            <h3>load time: {{loadingTime}}s, agg time: {{aggTime}}ms</h3>-->
            <vue-virtual-table :itemHeight="55"
                               :height="500"
                               :config="tableConfig"
                               :data="tableData"></vue-virtual-table>
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
			receivedLength: 0,
			chunks: [],
		}),
		computed: {
			tableConfig: function () {
				return this.columns.map(column => {
					return {prop: column};
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

			loadedMBytes: function () {
				return Math.round(this.loadedBytes / 1024 / 1024);
			}
		},
		methods: {
			calculateLoadingTime() {
				this.endLoading = new Date();
				this.loadingTime = Math.round((this.endLoading - this.startLoading) / 1000);
			},
			calculateAggTime() {
				this.endLoading = new Date();
				this.aggTime = Math.round((this.endLoading - this.startLoadingAggTime));
			},
			async commitLoadedData() {
				const json = this.chunks;
				const firstIndex = json.indexOf('[{');
				const lastIndex = json.indexOf('}]');
				if (firstIndex < 0 || lastIndex < 0) {
					return;
				}
				let data = json.slice(firstIndex, lastIndex + 2);
				this.startLoadingAggTime = new Date();

				const batch = JSON.parse(data);
				this.loaded += batch.length;
				this.table.update(batch);

				this.calculateLoadingTime();
				this.calculateAggTime();

				this.chunks = json.slice(lastIndex + 2, json.length);
				this.receivedLength = 0;
			},
			async fetchDataStream() {
				this.startLoading = new Date();
				fetch('/api/data-stream')
					.then(async response => {
						this.setIntervalId = setInterval(this.commitLoadedData, 200);
						const reader = response.body.getReader();
						// eslint-disable-next-line no-constant-condition
						while (true) {
							const {done, value} = await reader.read();
							if (done) {
								break;
							}
							this.chunks += new TextDecoder("utf-8").decode(value);
							this.calculateLoadingTime();
						}
					})
					.then(() => {
						clearInterval(this.setIntervalId);
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
