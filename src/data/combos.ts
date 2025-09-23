import { Combo } from '../types';

export const combos: Combo[] = [
  {
    id: 'vip',
    name: 'VIP Premium',
    price: 2500000,
    features: [
      'Ghế hàng đầu sát sân khấu',
      'Welcome drink miễn phí',
      'Quà tặng độc quyền',
      'Meet & Greet với nghệ sĩ',
      'Ảnh ký tặng'
    ],
    popular: true
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 1200000,
    features: [
      'Ghế ngồi thoải mái',
      'View sân khấu tuyệt vời',
      'Âm thanh chất lượng cao',
      'Dịch vụ bar có sẵn'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 800000,
    features: [
      'Ghế đứng khu vực sau',
      'Trải nghiệm âm nhạc đầy đủ',
      'Giá cả phải chăng',
      'Không gian thoải mái'
    ]
  }
];