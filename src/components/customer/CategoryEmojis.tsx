
export const getCategoryEmoji = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('burger') || name.includes('sandwich')) return '🍔';
  if (name.includes('pizza')) return '🍕';
  if (name.includes('salad') || name.includes('green')) return '🥗';
  if (name.includes('drink') || name.includes('beverage') || name.includes('juice')) return '🍹';
  if (name.includes('dessert') || name.includes('sweet') || name.includes('cake')) return '🍰';
  if (name.includes('chicken') || name.includes('meat')) return '🍗';
  if (name.includes('fish') || name.includes('seafood')) return '🐟';
  if (name.includes('pasta') || name.includes('noodle')) return '🍝';
  if (name.includes('rice') || name.includes('grain')) return '🍚';
  if (name.includes('breakfast') || name.includes('morning')) return '🍳';
  if (name.includes('soup')) return '🍲';
  if (name.includes('coffee') || name.includes('tea')) return '☕';
  if (name.includes('special') || name.includes('chef')) return '⭐';
  
  return '🍽️'; // Default food emoji
};
