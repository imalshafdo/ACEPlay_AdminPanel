export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'lines';

export interface FieldConfig {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
}

export interface ResourceConfig {
  key: string;
  label: string;
  endpoint: string;
  section: string;
  description?: string;
  singleton?: boolean;
  listColumns: { key: string; label: string }[];
  fields: FieldConfig[];
}

const statusField: FieldConfig = {
  key: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
  ],
};

const placementField: FieldConfig = {
  key: 'placement',
  label: 'Placement',
  type: 'select',
  options: [
    { value: 'hero', label: 'Hero (main banner)' },
    { value: 'exclusive', label: 'Exclusive promotions' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'other', label: 'Other' },
  ],
};

export const resources: ResourceConfig[] = [
  {
    key: 'site-settings',
    label: 'Site & header',
    endpoint: 'site-settings',
    section: 'Homepage',
    description: 'Brand name, tagline, logo, feature bullets, CTA buttons',
    singleton: true,
    listColumns: [],
    fields: [
      { key: 'siteName', label: 'Site name', required: true },
      {
        key: 'countryGroup',
        label: 'Country',
        type: 'select',
        required: true,
        options: [
          { value: 'thailand', label: 'Thailand' },
          { value: 'bangladesh', label: 'Bangladesh' },
          { value: 'philippines', label: 'Philippines' },
        ],
      },
      { key: 'launchYear', label: 'Launch year' },
      { key: 'depositMin', label: 'Min deposit text' },
      { key: 'depositMax', label: 'Max deposit text' },
      { key: 'tagline', label: 'Tagline', type: 'textarea' },
      { key: 'logoUrl', label: 'Logo image URL' },
      {
        key: 'features',
        label: 'Feature bullets (one per line)',
        type: 'lines',
        hint: 'e.g. Full Promotion Bonus is given out every day',
      },
      {
        key: 'endorsementLogos',
        label: 'Endorsement logo URLs (one per line)',
        type: 'lines',
      },
      { key: 'playNowLabel', label: 'Play Now button label' },
      { key: 'playNowUrl', label: 'Play Now URL' },
      { key: 'alternateLinksLabel', label: 'Alternate links label' },
      { key: 'alternateLinksUrl', label: 'Alternate links URL' },
      { key: 'viewPromotionsLabel', label: 'View promotions label' },
      { key: 'viewPromotionsUrl', label: 'View promotions URL' },
      statusField,
    ],
  },
  {
    key: 'navigation',
    label: 'Navigation menu',
    endpoint: 'navigation',
    section: 'Homepage',
    description: 'Slots, Live Casino, Sports, etc.',
    listColumns: [
      { key: 'label', label: 'Label' },
      { key: 'sortOrder', label: 'Order' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'label', label: 'Label', required: true },
      { key: 'icon', label: 'Icon (emoji)' },
      { key: 'url', label: 'Link URL' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      statusField,
    ],
  },
  {
    key: 'exclusive-banners',
    label: 'Promotion banners',
    endpoint: 'banners',
    section: 'Homepage',
    description: 'Image-only promo tiles (placement: exclusive)',
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'placement', label: 'Placement' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'image', label: 'Image URL', required: true },
      { key: 'link', label: 'Link URL' },
      { key: 'deposit', label: 'Deposit' },
      { key: 'bonus', label: 'Bonus' },
      { key: 'getAmount', label: 'Get' },
      { key: 'turnover', label: 'Turnover' },
      { key: 'withdraw', label: 'Withdraw' },
      {
        key: 'placement',
        label: 'Placement',
        type: 'select',
        options: [{ value: 'exclusive', label: 'Exclusive promotions' }],
      },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      statusField,
    ],
  },
  {
    key: 'big-wins',
    label: 'Big wins',
    endpoint: 'big-wins',
    section: 'Homepage',
    description: 'Celebrate Big Wins carousel cards',
    listColumns: [
      { key: 'gameName', label: 'Game' },
      { key: 'winnings', label: 'Winnings' },
      { key: 'multiplier', label: 'Multiplier' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
      { key: 'gameName', label: 'Game name', required: true },
      { key: 'provider', label: 'Provider' },
      { key: 'thumbnailImage', label: 'Game thumbnail URL' },
      { key: 'betAmount', label: 'Bet amount' },
      { key: 'winnings', label: 'Winnings' },
      { key: 'multiplier', label: 'Multiplier badge (e.g. 111x)' },
      { key: 'playUrl', label: 'Play Now URL' },
      { key: 'countryGroup', label: 'Country group' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      statusField,
    ],
  },
  {
    key: 'popular-games',
    label: 'Popular games',
    endpoint: 'popular-games',
    section: 'Homepage',
    description: 'Most popular games section',
    listColumns: [
      { key: 'gameName', label: 'Game' },
      { key: 'winRate', label: 'Win rate' },
      { key: 'gamePlatform', label: 'Platform' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'gameName', label: 'Game name', required: true },
      { key: 'gamePlatform', label: 'Platform' },
      { key: 'image', label: 'Game image URL' },
      { key: 'winRate', label: 'Win rate %', type: 'number' },
      { key: 'maxWinnings', label: 'Max winnings text (e.g. Highest Winnings in Casino)' },
      { key: 'date', label: 'Win date' },
      { key: 'time', label: 'Win time' },
      { key: 'betAmount', label: 'Bet amount (Wager)' },
      { key: 'winAmount', label: 'Win amount (Winnings)' },
      { key: 'multiplier', label: 'Multiplier (e.g. 1,354x)' },
      { key: 'playUrl', label: 'Play Now URL' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'countryGroup', label: 'Country group' },
      statusField,
    ],
  },
  {
    key: 'exclusive-promotions',
    label: 'Exclusive promotions',
    endpoint: 'promotions',
    section: 'Homepage',
    description: 'Bottom promotional carousel',
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'tag', label: 'Tag' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'tag', label: 'Tag' },
      { key: 'image', label: 'Image URL' },
      { key: 'url', label: 'URL' },
      { key: 'deposit', label: 'Deposit' },
      { key: 'bonus', label: 'Bonus' },
      { key: 'turnover', label: 'Turnover' },
      { key: 'netwin', label: 'Game wins' },
      { key: 'maxWithdrawal', label: 'Maximum Withdrawal' },
      { key: 'gameType', label: 'Game type' },
      { key: 'primaryBtnLabel', label: 'Primary button label' },
      { key: 'primaryBtnUrl', label: 'Primary button link' },
      { key: 'secondaryBtnLabel', label: 'Secondary button label' },
      { key: 'secondaryBtnUrl', label: 'Secondary button link' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'countryGroup', label: 'Country group' },
      statusField,
    ],
  },
  {
    key: 'casinos',
    label: 'Casinos',
    endpoint: 'casinos',
    section: 'Data',
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'countryGroup', label: 'Country' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'countryGroup', label: 'Country group', required: true },
      { key: 'currency', label: 'Currency' },
      { key: 'description', label: 'Description', type: 'textarea' },
      statusField,
    ],
  },
  {
    key: 'games',
    label: 'Game catalog',
    endpoint: 'games',
    section: 'Data',
    listColumns: [
      { key: 'gameName', label: 'Game' },
      { key: 'gameType', label: 'Type' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'gameName', label: 'Game name', required: true },
      { key: 'gameType', label: 'Game type', required: true },
      { key: 'gamePlatform', label: 'Platform' },
      { key: 'image', label: 'Image URL' },
      { key: 'url', label: 'URL' },
      statusField,
    ],
  },
  {
    key: 'countries',
    label: 'Countries',
    endpoint: 'countries',
    section: 'Data',
    listColumns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'code', label: 'Code', required: true },
      { key: 'name', label: 'Name', required: true },
      statusField,
    ],
  },
];

export const getResource = (key: string) => resources.find((r) => r.key === key);

export const resourceSections = [...new Set(resources.map((r) => r.section))];

export const resourcesBySection = (section: string) =>
  resources.filter((r) => r.section === section);
