<?php
namespace JoshSpivey\SalesGrid\Controller\Adminhtml\Orders;

class Index extends \Magento\Framework\App\Action\Action
{
  /**
  * Index Action*
  * @return void
  */
  public function execute()
  {
      $this->_view->loadLayout();
      $this->_view->renderLayout();
  }

  public function getOrders(){
  	// return  $this->resultJsonFactory->create()->setData(['Test-Message' => $message]);
  }
}
