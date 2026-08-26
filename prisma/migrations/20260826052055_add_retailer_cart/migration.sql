-- CreateTable
CREATE TABLE "Cart" (
    "cart_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("cart_id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "cart_item_id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("cart_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_customer_id_key" ON "Cart"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cart_id_product_id_key" ON "CartItem"("cart_id", "product_id");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "Cart"("cart_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
