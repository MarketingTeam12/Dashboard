export const APPROVAL_STORAGE_KEY = 'zcrm.dealApprovals.records.v2';

export const TEMPLATE_APPROVALS = [
  {
    id: 'app-1',
    dealCode: 'DL-024',
    discount: '15%',
    discountPct: 15,
    ruleName: 'Enterprise Discount Rule (>12%)',
    requestedBy: 'Priya Sharma',
    requesterRole: 'Senior Executive',
    approver: 'Arun Kumar',
    requestedOn: '08 Oct 2026',
    status: 'Pending',
    comment: 'This discount is requested to close the deal as the client has a competing offer. Approval kindly requested.',
  },
  {
    id: 'app-2',
    dealCode: 'DL-031',
    discount: '10%',
    discountPct: 10,
    ruleName: 'Strategic Multi-Year Contract Rule',
    requestedBy: 'Ravi Kumar',
    requesterRole: 'Account Executive',
    approver: 'Sneha R',
    requestedOn: '07 Oct 2026',
    status: 'Approved',
    comment: 'Strategic enterprise client committing to 3-year contract.',
  },
  {
    id: 'app-3',
    dealCode: 'DL-028',
    discount: '20%',
    discountPct: 20,
    ruleName: 'High-Volume Expansion Approval',
    requestedBy: 'Anitha M',
    requesterRole: 'Consultant',
    approver: 'Vikram P',
    requestedOn: '06 Oct 2026',
    status: 'Pending',
    comment: 'Volume discount requested for enterprise expansion.',
  },
  {
    id: 'app-4',
    dealCode: 'DL-029',
    discount: '12%',
    discountPct: 12,
    ruleName: 'Custom Pricing Bundle Approval',
    requestedBy: 'Arun Kumar',
    requesterRole: 'Deal Strategist',
    approver: 'Priya Sharma',
    requestedOn: '05 Oct 2026',
    status: 'Approved',
    comment: 'Custom pricing bundle for server infrastructure upgrade.',
  },
  {
    id: 'app-5',
    dealCode: 'DL-033',
    discount: '18%',
    discountPct: 18,
    ruleName: 'Government Contractor Margin Rule',
    requestedBy: 'Divya R',
    requesterRole: 'Solutions Rep',
    approver: 'Ravi Kumar',
    requestedOn: '04 Oct 2026',
    status: 'Pending',
    comment: 'Security compliance suite discounted for government contractor.',
  },
  {
    id: 'app-6',
    dealCode: 'DL-035',
    discount: '15%',
    discountPct: 15,
    ruleName: 'AMC Early Bird Threshold Rule',
    requestedBy: 'Karthik S',
    requesterRole: 'Sales Lead',
    approver: 'Anitha M',
    requestedOn: '03 Oct 2026',
    status: 'Rejected',
    comment: 'Annual maintenance agreement early bird incentive exceeds margin threshold.',
  },
  {
    id: 'app-7',
    dealCode: 'DL-037',
    discount: '10%',
    discountPct: 10,
    ruleName: 'API Customization Package Approval',
    requestedBy: 'Sneha R',
    requesterRole: 'Customer Success',
    approver: 'Arun Kumar',
    requestedOn: '02 Oct 2026',
    status: 'Approved',
    comment: 'API integration customization package approved by management.',
  },
];

export function buildApprovalsList(deals = [], accountName = () => '', userName = () => '', approvalsOverrides = {}) {
  const linked = TEMPLATE_APPROVALS.map((tpl, idx) => {
    const realDeal = deals[idx] || deals[0];
    const dealId = realDeal ? realDeal.id : `deal-${idx + 1}`;
    const dealName = realDeal ? realDeal.name : `Enterprise Deal ${tpl.dealCode}`;
    const account = realDeal && realDeal.accountId ? accountName(realDeal.accountId) : 'Enterprise Account';
    const amount = realDeal ? Number(realDeal.amount) || 850000 : 850000;
    const expectedRevenue = Math.round(amount * (1 - tpl.discountPct / 100));
    const override = approvalsOverrides[tpl.id] || {};
    const status = realDeal?.approvalStatus || override.status || tpl.status;

    return {
      ...tpl,
      ...override,
      dealId,
      dealName,
      stage: realDeal?.stage || 'Negotiation',
      closingDate: realDeal?.closingDate || '2026-10-30',
      account,
      amount,
      expectedRevenue,
      status,
      approver: realDeal?.approverName || override.approver || tpl.approver,
      commentsList: override.commentsList || [
        { by: tpl.requestedBy, text: tpl.comment, time: tpl.requestedOn },
      ],
    };
  });

  const existingDealIds = new Set(linked.map((a) => a.dealId));
  deals.forEach((d, i) => {
    if (!existingDealIds.has(d.id) && (d.approvalStatus || Number(d.amount) >= 500000)) {
      const appId = `app-deal-${d.id}`;
      const override = approvalsOverrides[appId] || {};
      const discPct = Number(d.approvalDiscountPct) || 10;
      const amt = Number(d.amount) || 500000;
      linked.push({
        id: appId,
        dealId: d.id,
        dealCode: `DL-${100 + i}`,
        dealName: d.name,
        stage: d.stage || 'Proposal',
        closingDate: d.closingDate || '2026-10-30',
        ruleName: 'High-Value Deal Approval (>₹5L)',
        account: d.accountId ? accountName(d.accountId) : 'Corporate Client',
        requestedBy: userName(d.ownerId) || 'Karthik S',
        requesterRole: 'Sales Executive',
        discount: `${discPct}%`,
        discountPct: discPct,
        amount: amt,
        expectedRevenue: Math.round(amt * (1 - discPct / 100)),
        approver: d.approverName || override.approver || 'Sibi Chakaravarthi',
        requestedOn: d.createdOn || '10 Oct 2026',
        status: d.approvalStatus || override.status || 'Pending',
        comment: d.description || 'High-value deal approval request generated by workflow rule.',
        commentsList: override.commentsList || [
          {
            by: userName(d.ownerId) || 'Karthik S',
            text: d.description || 'High-value deal approval request generated by workflow rule.',
            time: d.createdOn || '10 Oct 2026',
          },
        ],
      });
    }
  });

  return linked;
}

