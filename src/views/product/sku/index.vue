<template>
  <el-card>
    <el-table border style="margin: 10px 0px" :data="skuArr">
      <el-table-column type="index" label="序号" width="80px"></el-table-column>
      <el-table-column prop="skuName" label="名称" width="80px" show-overflow-tooltip></el-table-column>
      <el-table-column prop="skuDesc" label="描述" width="300px" show-overflow-tooltip></el-table-column>
      <el-table-column label="图片" width="300px">
        <template #="{ row, $index }">
          <img :src="row.skuDefaultImg" style="width: 100px; height: 100px" />
        </template>
      </el-table-column>
      <el-table-column label="重量" width="300px" prop="weight"></el-table-column>
      <el-table-column label="价格" width="300px" prop="price"></el-table-column>
      <el-table-column label="操作" width="300px" fixed="right">
        <template #="{ row, $index }">
          <el-button
            type="primary"
            size="small"
            :icon="row.isSale == 1 ? 'Bottom' : 'Top'"
            @click="updateSale(row)"
          ></el-button>
          <el-button type="primary" size="small" icon="Edit" @click="updateSku"></el-button>
          <el-button type="primary" size="small" icon="InfoFilled" @click="findSku(row)"></el-button>
          <el-popconfirm
            :title="`你确定要删除${row.skuName}?`"
            width="200px"
            @confirm="removeSku(row.id)"
          >
            <template #reference>
              <el-button type="primary" size="small" icon="Delete"></el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handler"
      @current-change="getHasSku"
      v-model:current-page="pageNo"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 30, 40]"
      :background="true"
      layout="prev, pager, next, jumper, ->,sizes,total "
      :total="total"
    />
    <!-- 抽屉组件:展示商品详情 -->
    <el-drawer v-model="drawer">
      <!-- 标题部分 -->
      <template #header>
        <h4>查看商品的详情</h4>
      </template>
      <template #default>
        <el-row style="margin:10px 0px;">
          <el-col :span="6">名称</el-col>
          <el-col :span="18">{{ skuInfo.skuName }}</el-col>
        </el-row>
        <el-row style="margin:10px 0px;">
          <el-col :span="6">描述</el-col>
          <el-col :span="18">{{ skuInfo.skuDesc }}</el-col>
        </el-row>
        <el-row style="margin:10px 0px;">
          <el-col :span="6">价格</el-col>
          <el-col :span="18">{{ skuInfo.price }}</el-col>
        </el-row>
        <el-row style="margin:10px 0px;">
          <el-col :span="6">平台属性</el-col>
          <el-col :span="18">
            <el-tag style="margin:5px;" v-for="item in skuInfo.skuAttrValueList" :key="item.id">
              {{
              item.valueName }}
            </el-tag>
          </el-col>
        </el-row>
        <el-row style="margin:10px 0px;">
          <el-col :span="6">销售属性</el-col>
          <el-col :span="18">
            <el-tag
              style="margin:5px;"
              v-for="item in skuInfo.skuSaleAttrValueList"
              :key="item.id"
            >{{ item.saleAttrValueName }}</el-tag>
          </el-col>
        </el-row>
        <el-row style="margin:10px 0px;">
          <el-col :span="6">商品图片</el-col>
          <el-col :span="18">
            <el-carousel :interval="4000" type="card" height="200px">
              <el-carousel-item v-for="item in skuInfo.skuImageList" :key="item.id">
                <img :src="item.imgUrl" style="width:100%;height: 100%;" />
              </el-carousel-item>
            </el-carousel>
          </el-col>
        </el-row>
      </template>
    </el-drawer>
  </el-card>
</template>
<script lang="ts" setup>
import { ref, onMounted } from 'vue'
//引入请求
import {
  reqSkuList,
  reqCancelSale,
  reqSaleSku,
  reqSkuInfo,
  reqRemoveSku,
} from '@/api/product/sku'
//引入ts类型
import type {
  SkuResponseData,
  SkuData,
  SkuInfoData,
} from '@/api/product/sku/type'

import { ElMessage } from 'element-plus'
//分页器当前页码
let pageNo = ref<number>(1)
//每一页展示几条数据
let pageSize = ref<number>(10)
let total = ref<number>(0)
let skuArr = ref<SkuData[]>([])
// 控制抽屉显示与隐藏的字段
let drawer = ref<boolean>(false)
let skuInfo = ref<any>({})

// 查看商品详情按钮的回调
const findSku = async (row: SkuData) => {
  drawer.value = true
  //获取已有商品详情数据
  let result: SkuInfoData = await reqSkuInfo(row.id as number)
  //存储已有的SKU
  skuInfo.value = result.data
}
//组件挂载完毕
onMounted(() => {
  getHasSku()
})
const getHasSku = async (pager = 1) => {
  // 当前分页器的页码
  pageNo.value = pager
  let result: SkuResponseData = await reqSkuList(pageNo.value, pageSize.value)
  if (result.code == 200) {
    total.value = result.data.total
    skuArr.value = result.data.records
  }
}
//分页器下拉菜单发生变化触发
const handler = () => {
  getHasSku()
}

// 商品的上架与下架的操作
const updateSale = async (row: SkuData) => {
  // 如果当前商品的isSale==1,说明当前商品是上架的额状态->更新为下架
  // 否则else情况与上面情况相反
  if (row.isSale == 1) {
    //下架操作
    await reqCancelSale(row.id as number)
    //提示信息
    ElMessage({ type: 'success', message: '下架成功' })
    //发请求获取当前更新完毕的全部已有的SKU
    getHasSku(pageNo.value)
  } else {
    //下架操作
    await reqSaleSku(row.id as number)
    //提示信息
    ElMessage({ type: 'success', message: '上架成功' })
    //发请求获取当前更新完毕的全部已有的SKU
    getHasSku(pageNo.value)
  }
}

//更新已有的SKU
const updateSku = () => {
  ElMessage({ type: 'success', message: '程序员在努力的更新中....' })
}

//删除某一个已有的商品
const removeSku = async (id: number) => {
  //删除某一个已有商品的情况
  let result: any = await reqRemoveSku(id)
  if (result.code == 200) {
    //提示信息
    ElMessage({ type: 'success', message: '删除成功' })
    //获取已有全部商品
    getHasSku(skuArr.value.length > 1 ? pageNo.value : pageNo.value - 1)
  } else {
    //删除失败
    ElMessage({ type: 'error', message: '系统数据不能删除' })
  }
}
</script>