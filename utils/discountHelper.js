export function isDiscountCurrentlyActive(discount, now = new Date()) {
  if (!discount || !discount.is_active) return false;

  if (discount.starts_at) {
    const start = new Date(discount.starts_at);
    if (!Number.isNaN(start.getTime()) && now < start) return false;
  }

  if (discount.ends_at) {
    const end = new Date(discount.ends_at);
    if (!Number.isNaN(end.getTime()) && now > end) return false;
  }

  return true;
}

export function calculateDiscountedPrice(originalPrice, discount) {
  const price = Number(originalPrice || 0);
  if (!discount || price <= 0) {
    return {
      originalPrice: price,
      finalPrice: price,
      hasDiscount: false,
      savings: 0,
      label: null,
      discount: null,
    };
  }

  const value = Number(discount.discount_value || 0);
  let savings = 0;

  if (discount.discount_type === 'fixed') {
    savings = Math.min(price, value);
  } else {
    savings = (price * value) / 100;
  }

  const finalPrice = Math.max(0, Number((price - savings).toFixed(2)));
  const label =
    discount.discount_type === 'fixed'
      ? `Rs ${Math.round(value)} Off`
      : `${Number(value)}% Off`;

  return {
    originalPrice: price,
    finalPrice,
    hasDiscount: savings > 0,
    savings,
    label,
    discount,
  };
}

// Finds the best active discount for a specific menu item (item-specific first, then branch-wide)
export function getBestMenuItemDiscount(item, branchDiscounts = [], now = new Date()) {
  const active = (branchDiscounts || []).filter((d) => isDiscountCurrentlyActive(d, now));

  const itemSpecific = active.filter(
    (d) => d.scope === 'menu_item' && Number(d.menu_item_id) === Number(item?.id)
  );

  const branchWide = active.filter((d) => d.scope === 'branch');

  const candidates = itemSpecific.length > 0 ? itemSpecific : branchWide;
  if (candidates.length === 0) return null;

  const basePrice = Number(item?.price || 0);
  return candidates.reduce((best, current) => {
    if (!best) return current;
    const bestCalc = calculateDiscountedPrice(basePrice, best);
    const currCalc = calculateDiscountedPrice(basePrice, current);
    return currCalc.savings > bestCalc.savings ? current : best;
  }, null);
}

// Finds the top active branch-wide promo label for RestaurantCard / FeaturedAdCard
export function getBranchPromoSummary(branch, now = new Date()) {
  const discounts = branch?.discounts || branch?.branch_discounts || [];
  const active = discounts.filter((d) => isDiscountCurrentlyActive(d, now));

  if (active.length === 0) {
    return branch?.promo_text || null;
  }

  const branchWide = active.filter((d) => d.scope === 'branch');
  const pool = branchWide.length > 0 ? branchWide : active;

  const top = pool.reduce((best, current) => {
    if (!best) return current;
    return Number(current.discount_value || 0) > Number(best.discount_value || 0)
      ? current
      : best;
  }, null);

  if (!top) return branch?.promo_text || null;

  const badge =
    top.discount_type === 'fixed'
      ? `Rs ${Math.round(Number(top.discount_value))} Off`
      : `${Number(top.discount_value)}% Off`;

  return top.promo_code ? `${badge} • ${top.promo_code}` : badge;
}