<?php
namespace JoshSpivey\SalesGrid\Controller\Adminhtml\Orders;

class GridFields extends \Magento\Framework\App\Action\Action
{
    /** @var \Magento\Framework\View\Result\PageFactory  */
    protected $resultPageFactory;
    protected $resultJsonFactory;
    protected $orderInterface;
    

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\View\Result\PageFactory $resultPageFactory,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Magento\Sales\Api\Data\OrderInterface $orderInterface
    ){
        $this->resultPageFactory = $resultPageFactory;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->orderInterface = $orderInterface;
        parent::__construct($context);
    }

    public function execute()
    {

      header('Content-Type: application/json');
      echo json_encode($this->getOrderAttributes(),  JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
      //use json encode until they fix the number type casting in the mage 2 json factory
      //see issue for updates https://github.com/magento/magento2/issues/8244
      // return  $this->resultJsonFactory->create()->setData($this->getOrders());
    }



    public function getOrderAttributes()
    {
        $orderReflect = new \ReflectionClass($this->orderInterface);
        $tmpContsants = $orderReflect->getConstants();
        $orderAttribArr = [];
        foreach($tmpContsants as $key => $value){
          $textFormatted = ucwords(str_replace('_', ' ', $value));
          array_push($orderAttribArr, ['label' => $textFormatted, 'val' => $value]);
        }

        return $orderAttribArr;
    }
}