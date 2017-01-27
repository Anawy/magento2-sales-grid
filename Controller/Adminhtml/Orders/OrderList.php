<?php
namespace JoshSpivey\SalesGrid\Controller\Adminhtml\Orders;

class OrderList extends \Magento\Framework\App\Action\Action
{
    /** @var \Magento\Framework\View\Result\PageFactory  */
    protected $orderRepository;
    protected $orderItemRepository;
    protected $searchCriteriaBuilder;
    protected $filterBuilder;
    protected $resultJsonFactory;
    protected $sortOrderBuilder;
    protected $filterGroupBuilder;
    protected $filterGroup;

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Sales\Api\OrderRepositoryInterface $orderRepository,
        \Magento\Sales\Api\OrderItemRepositoryInterface $orderItemRepository,
        \Magento\Framework\Api\SearchCriteriaBuilder $searchCriteriaBuilder,
        \Magento\Framework\Api\FilterBuilder $filterBuilder,
        \Magento\Framework\Api\Search\FilterGroupBuilder $filterGroupBuilder,
        \Magento\Framework\Api\Search\FilterGroup $filterGroup,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Magento\Framework\Api\SortOrderBuilder $sortOrderBuilder
    ){
        $this->orderRepository = $orderRepository;
        $this->orderItemRepository = $orderItemRepository;
        $this->searchCriteriaBuilder = $searchCriteriaBuilder;
        $this->filterBuilder = $filterBuilder;
        $this->filterGroupBuilder = $filterGroupBuilder;
        $this->filterGroup = $filterGroup;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->sortOrderBuilder = $sortOrderBuilder;
        parent::__construct($context);
    }

    public function execute()
    {
// $this->getOrders();
     header('Content-Type: application/json');
     echo json_encode($this->getOrders(),  JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
      //use json encode until they fix the number type casting in the mage 2 json factory
      //see issue for updates https://github.com/magento/magento2/issues/8244
      // return  $this->resultJsonFactory->create()->setData($this->getOrders());
    }

    public function getOrders()
    {
      $perPage = $this->getRequest()->getParam('results_per_page');
      $page = $this->getRequest()->getParam('page');
      $sortBy = ($this->getRequest()->getParam('sort_by'))? $this->getRequest()->getParam('sort_by') : 'created_at';
      $orderBy = ($this->getRequest()->getParam('order'))? $this->getRequest()->getParam('order') : 'DESC';
      $keyword = $this->getRequest()->getParam('keyword');
      $productSearch = $this->getRequest()->getParam('productSearch');
      $searchColumns = $this->getRequest()->getParam('searchColumns');

      if($productSearch){

        $productFilters[] = $this->filterBuilder->setField('sku')
          ->setValue('%'.$productSearch.'%')
          ->setConditionType('like')
          ->create();

        $productFilters[] = $this->filterBuilder->setField('name')
          ->setValue('%'.$productSearch.'%')
          ->setConditionType('like')
          ->create();

        $filter_group_products = $this->filterGroup
          ->setFilters($productFilters)
          ->create();

        //   $this->searchCriteriaBuilder->addFilters(
        //     array_map(function (string $sku): Filter {
        //     return $this->filterBuilder->setField('sku')->setValue($sku)->create();
        // }, $skusToMatch));
// // order_id


      }elseif($keyword && $searchColumns == "false"){

        $filters[] = $this->filterBuilder->setField('increment_id')
          ->setValue('%'.$keyword.'%')
          ->setConditionType('like')
          ->create();
        $filters[] = $this->filterBuilder->setField('customer_email')
          ->setValue('%'.$keyword.'%')
          ->setConditionType('like')
          ->create();
        $filters[] = $this->filterBuilder->setField('customer_firstname')
          ->setValue('%'.$keyword.'%')
          ->setConditionType('like')
          ->create();
        $filters[] = $this->filterBuilder->setField('customer_lastname')
          ->setValue('%'.$keyword.'%')
          ->setConditionType('like')
          ->create();

        $filter_group = $this->filterGroup
          ->setFilters($filters)
          ->create();

      }elseif($keyword && $searchColumns != "false"){

        $searchableCol = explode(',', rtrim($searchColumns,','));
        $blackList = ['created_at', 'updated_at'];

        foreach($searchableCol as $tmpCol){
          if(!in_array($tmpCol, $blackList)){
            $filters[] = $this->filterBuilder->setField(trim($tmpCol))
              ->setValue('%'.$keyword.'%')
              ->setConditionType('like')
              ->create();
          }
        }
        if(count($filters) > 0){
          $filter_group = $this->filterGroup
            ->setFilters($filters)
            ->create();
        }
      }else{
        $filters[] = $this->filterBuilder->setField('entity_id')
          ->setValue(0)
          ->setConditionType('gt')
          ->create();
      }
 
      $sortOrder = $this->sortOrderBuilder
            ->setField($sortBy)
            ->setDirection($orderBy)
            ->create();
      


      if($productSearch){
        $searchCriteriaProducts = $this->searchCriteriaBuilder
                      // ->addFilters($productFilters)
                      ->setFilterGroups([$filter_group_products])
                      ->create();

                     // echo 'test'. $searchCriteriaProducts->getSelect()->__toString();die;

        //do array map on order id w filter and entity id for search like on order repo. Maybe a distinct
        $listProducts = $this->orderItemRepository->getList($searchCriteriaProducts);
        echo 'prouct start'.var_dump($listProducts->getData()).'prouct end';
        // foreach($listProducts as $tmpItem){
        //   echo $tmpItem[];
        // }
          //       $filters[] = $this->filterBuilder->setField('entity_id')
          // ->setValue(0)
          // ->setConditionType('gt')
          // ->create();
      }else{

        if(isset($filter_group)){
          $searchCriteria = $this->searchCriteriaBuilder
                        ->setFilterGroups([$filter_group])
                        ->setPageSize($perPage)
                        ->setCurrentPage($page)
                        ->addSortOrder($sortOrder)
                        ->addFilters($filters)
                        ->create();
        }else{
          $searchCriteria = $this->searchCriteriaBuilder
                ->setPageSize($perPage)
                ->setCurrentPage($page)
                ->addSortOrder($sortOrder)
                ->addFilters($filters)
                ->create();
        }
        $list = $this->orderRepository->getList($searchCriteria); 
      }
      
      // echo 'prouct start'.print_r($listProducts->getData()).'prouct end';
      // $products = $list->getItems();
      // foreach($products as $product)
      // {
      //     echo $product->getSku(),"\n";
      // }

       
      $totalCount = $list->getSize();
      return array(
        'data'=> $list->getData(),
        'total_count' => $totalCount,
        'total_pages' => ceil($totalCount/$perPage)
      );

    }
}