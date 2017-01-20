<?php
namespace JoshSpivey\SalesGrid\Controller\Adminhtml\Orders;

class OrderList extends \Magento\Framework\App\Action\Action
{
    /** @var \Magento\Framework\View\Result\PageFactory  */
    protected $resultPageFactory;
    protected $orderRepository;
    protected $searchCriteriaBuilder;
    protected $filterBuilder;
    protected $resultJsonFactory;
    protected $sortOrderBuilder;

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\View\Result\PageFactory $resultPageFactory,
        \Magento\Sales\Api\OrderRepositoryInterface $orderRepository,
        \Magento\Framework\Api\SearchCriteriaBuilder $searchCriteriaBuilder,
        \Magento\Framework\Api\FilterBuilder $filterBuilder,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Magento\Framework\Api\SortOrderBuilder $sortOrderBuilder
    ){
        $this->resultPageFactory = $resultPageFactory;
        $this->orderRepository = $orderRepository;
        $this->searchCriteriaBuilder = $searchCriteriaBuilder;
        $this->filterBuilder = $filterBuilder;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->sortOrderBuilder = $sortOrderBuilder;
        parent::__construct($context);
    }

    public function execute()
    {
      return  $this->resultJsonFactory->create()->setData($this->getOrders());
    }

    public function getOrders()
    {
      $perPage = $this->getRequest()->getParam('results_per_page');
      $page = $this->getRequest()->getParam('page');
      $sortBy = ($this->getRequest()->getParam('sort_by'))? $this->getRequest()->getParam('sort_by') : 'created_at';
      $orderBy = ($this->getRequest()->getParam('order'))? $this->getRequest()->getParam('order') : 'DESC';

      $keyword = $this->getRequest()->getParam('keyword');

      

      $count = 0;

      // if(){
      $filters[] = $this->filterBuilder->setField('entity_id')
        ->setValue(0)
        ->setConditionType('gt')
        ->create();


      $sortOrder = $this->sortOrderBuilder
            ->setField($sortBy)
            ->setDirection($orderBy)
            ->create();
      

// https://github.com/thejinxters/magento2-testing/blob/master/lib/internal/Magento/Framework/Api/SearchCriteriaBuilder.php

      $searchCriteria = $this->searchCriteriaBuilder
                            ->setPageSize($perPage)
                            ->setCurrentPage($page)
                            ->addSortOrder($sortOrder)
                            ->addFilters($filters)
                            ->create();
      // setSortOrders
      //$searchCriteria = $this->searchCriteriaBuilder->create();
      $list = $this->orderRepository->getList($searchCriteria);  
      $totalCount = $list->getSize();
      return array(
        'data'=> $list->getData(),
        'total_count' => $totalCount,//count($list)
        'total_pages' => ceil($totalCount/$perPage)
      );
        //echo  $this->orderRepository->getSize();

    }
}